import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { WebSocket } from 'ws';
import { RaceWebSocketServer } from '../race-server';
import type {
  RaceStateUpdate,
  ErrorMessage,
  ServerMessage,
} from '../race-server';

function waitForMessage(ws: WebSocket): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Message timeout')), 5000);
    ws.once('message', (data) => {
      clearTimeout(timeout);
      resolve(JSON.parse(data.toString()));
    });
  });
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => reject(new Error('Open timeout')), 5000);
    ws.once('open', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function createClient(port: number): WebSocket {
  return new WebSocket(`ws://localhost:${port}/ws/race`);
}

describe('RaceWebSocketServer - Spectator Mode', () => {
  let httpServer: HttpServer;
  let raceWs: RaceWebSocketServer;
  let port: number;
  const clients: WebSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    raceWs = new RaceWebSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr !== null ? addr.port : 0;
        resolve();
      });
    });
  });

  afterEach(async () => {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    }
    clients.length = 0;

    raceWs.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  function newClient(): WebSocket {
    const client = createClient(port);
    clients.push(client);
    return client;
  }

  describe('race:spectate', () => {
    it('should send error when spectating a non-existent race', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(JSON.stringify({ type: 'race:spectate', raceId: 999 }));

      const msg = await waitForMessage(ws);
      expect(msg.type).toBe('error');
      expect((msg as ErrorMessage).message).toBe('Race not found');
    });

    it('should allow spectating an existing race', async () => {
      const racer = newClient();
      const spectator = newClient();
      await Promise.all([waitForOpen(racer), waitForOpen(spectator)]);

      // Create a race by joining
      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      // Spectate the race
      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));

      // Both racer and spectator should receive state update
      const racerMsg = (await waitForMessage(racer)) as RaceStateUpdate;
      const spectatorMsg = (await waitForMessage(spectator)) as RaceStateUpdate;

      expect(racerMsg.type).toBe('race:state');
      expect(racerMsg.spectatorCount).toBe(1);
      expect(racerMsg.participants).toHaveLength(1);

      expect(spectatorMsg.type).toBe('race:state');
      expect(spectatorMsg.spectatorCount).toBe(1);
      expect(spectatorMsg.participants).toHaveLength(1);
    });

    it('should not add spectator as participant', async () => {
      const racer = newClient();
      const spectator = newClient();
      await Promise.all([waitForOpen(racer), waitForOpen(spectator)]);

      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      const msg = (await waitForMessage(spectator)) as RaceStateUpdate;

      // Spectator should see participant but not be one
      expect(msg.participants).toHaveLength(1);
      expect(msg.participants[0].userId).toBe(10);

      // Room should track spectator count
      expect(raceWs.getSpectatorCount(1)).toBe(1);
    });

    it('should broadcast progress updates to spectators', async () => {
      const racer = newClient();
      const spectator = newClient();
      await Promise.all([waitForOpen(racer), waitForOpen(spectator)]);

      // Join race
      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      // Start spectating
      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer); // state update from spectator join
      await waitForMessage(spectator); // state update for spectator

      // Racer sends progress
      racer.send(
        JSON.stringify({
          type: 'race:progress',
          raceId: 1,
          userId: 10,
          progress: 50,
          currentWpm: 80,
        })
      );

      // Spectator should receive the progress update
      const spectatorMsg = (await waitForMessage(spectator)) as RaceStateUpdate;
      expect(spectatorMsg.type).toBe('race:state');
      const alice = spectatorMsg.participants.find((p) => p.userId === 10);
      expect(alice?.progress).toBe(50);
      expect(alice?.currentWpm).toBe(80);
    });

    it('should track multiple spectators', async () => {
      const racer = newClient();
      const spec1 = newClient();
      const spec2 = newClient();
      await Promise.all([
        waitForOpen(racer),
        waitForOpen(spec1),
        waitForOpen(spec2),
      ]);

      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      spec1.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer); // state with 1 spectator
      await waitForMessage(spec1);

      spec2.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));

      // All should receive update with 2 spectators
      const racerMsg = (await waitForMessage(racer)) as RaceStateUpdate;
      expect(racerMsg.spectatorCount).toBe(2);
      expect(raceWs.getSpectatorCount(1)).toBe(2);
    });
  });

  describe('race:unspectate', () => {
    it('should remove spectator and update count', async () => {
      const racer = newClient();
      const spectator = newClient();
      await Promise.all([waitForOpen(racer), waitForOpen(spectator)]);

      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer);
      await waitForMessage(spectator);

      expect(raceWs.getSpectatorCount(1)).toBe(1);

      // Unspectate
      spectator.send(JSON.stringify({ type: 'race:unspectate', raceId: 1 }));

      const racerMsg = (await waitForMessage(racer)) as RaceStateUpdate;
      expect(racerMsg.spectatorCount).toBe(0);
      expect(raceWs.getSpectatorCount(1)).toBe(0);
    });
  });

  describe('spectator disconnect', () => {
    it('should remove spectator on disconnect and update count', async () => {
      const racer = newClient();
      const spectator = newClient();
      await Promise.all([waitForOpen(racer), waitForOpen(spectator)]);

      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer);
      await waitForMessage(spectator);

      expect(raceWs.getSpectatorCount(1)).toBe(1);

      // Disconnect spectator
      spectator.close();

      // Racer should receive update with 0 spectators
      const racerMsg = (await waitForMessage(racer)) as RaceStateUpdate;
      expect(racerMsg.spectatorCount).toBe(0);
      expect(raceWs.getSpectatorCount(1)).toBe(0);
    });

    it('should not remove room when spectator disconnects', async () => {
      const racer = newClient();
      const spectator = newClient();
      await Promise.all([waitForOpen(racer), waitForOpen(spectator)]);

      racer.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer);

      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer);
      await waitForMessage(spectator);

      // Disconnect spectator
      spectator.close();
      await new Promise((r) => setTimeout(r, 100));

      // Room should still exist
      expect(raceWs.getRoomCount()).toBe(1);
      expect(raceWs.getRoom(1)?.participants.size).toBe(1);
    });
  });

  describe('spectator receives race lifecycle events', () => {
    it('should receive finish events as spectator', async () => {
      const racer1 = newClient();
      const racer2 = newClient();
      const spectator = newClient();
      await Promise.all([
        waitForOpen(racer1),
        waitForOpen(racer2),
        waitForOpen(spectator),
      ]);

      // Join race
      racer1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer1);

      racer2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(racer1);
      await waitForMessage(racer2);

      // Spectator joins
      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer1);
      await waitForMessage(racer2);
      await waitForMessage(spectator);

      // Racer1 finishes
      racer1.send(
        JSON.stringify({
          type: 'race:finish',
          raceId: 1,
          userId: 10,
          wpm: 90,
          accuracy: 98,
        })
      );

      // Spectator should see the finish update
      const spectatorMsg = (await waitForMessage(spectator)) as RaceStateUpdate;
      expect(spectatorMsg.type).toBe('race:state');
      const alice = spectatorMsg.participants.find((p) => p.userId === 10);
      expect(alice?.rank).toBe(1);
      expect(alice?.wpm).toBe(90);
      expect(alice?.accuracy).toBe(98);
      expect(alice?.finishedAt).toBeTruthy();
    });

    it('should see race status change to finished when all racers complete', async () => {
      const racer1 = newClient();
      const racer2 = newClient();
      const spectator = newClient();
      await Promise.all([
        waitForOpen(racer1),
        waitForOpen(racer2),
        waitForOpen(spectator),
      ]);

      racer1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(racer1);

      racer2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(racer1);
      await waitForMessage(racer2);

      spectator.send(JSON.stringify({ type: 'race:spectate', raceId: 1 }));
      await waitForMessage(racer1);
      await waitForMessage(racer2);
      await waitForMessage(spectator);

      // Both racers finish
      racer1.send(
        JSON.stringify({
          type: 'race:finish',
          raceId: 1,
          userId: 10,
          wpm: 90,
          accuracy: 98,
        })
      );
      await waitForMessage(racer1);
      await waitForMessage(racer2);
      await waitForMessage(spectator);

      racer2.send(
        JSON.stringify({
          type: 'race:finish',
          raceId: 1,
          userId: 20,
          wpm: 75,
          accuracy: 95,
        })
      );

      // Spectator should see finished status
      const spectatorMsg = (await waitForMessage(spectator)) as RaceStateUpdate;
      expect(spectatorMsg.status).toBe('finished');
      expect(spectatorMsg.participants.find((p) => p.userId === 10)?.rank).toBe(1);
      expect(spectatorMsg.participants.find((p) => p.userId === 20)?.rank).toBe(2);
    });
  });
});
