import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { WebSocket } from 'ws';
import { RaceWebSocketServer } from '../race-server';
import type {
  RaceStateUpdate,
  LobbyUpdate,
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

describe('RaceWebSocketServer', () => {
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
    // Close all clients
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

  describe('connection', () => {
    it('should accept WebSocket connections', async () => {
      const ws = newClient();
      await waitForOpen(ws);
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    it('should send error for invalid JSON', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send('invalid json');
      const msg = await waitForMessage(ws);
      expect(msg.type).toBe('error');
      expect((msg as ErrorMessage).message).toBe('Invalid message format');
    });

    it('should send error for unknown message type', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(JSON.stringify({ type: 'unknown:type' }));
      const msg = await waitForMessage(ws);
      expect(msg.type).toBe('error');
      expect((msg as ErrorMessage).message).toBe('Unknown message type');
    });
  });

  describe('race:join', () => {
    it('should create a room and add participant on join', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );

      const msg = (await waitForMessage(ws)) as RaceStateUpdate;
      expect(msg.type).toBe('race:state');
      expect(msg.raceId).toBe(1);
      expect(msg.status).toBe('waiting');
      expect(msg.participants).toHaveLength(1);
      expect(msg.participants[0].userId).toBe(10);
      expect(msg.participants[0].userName).toBe('Alice');
      expect(msg.participants[0].progress).toBe(0);
    });

    it('should add multiple participants to same room', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );

      // Wait for first join state update
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );

      // Both clients should receive the updated state
      const msg1 = (await waitForMessage(ws1)) as RaceStateUpdate;
      const msg2 = (await waitForMessage(ws2)) as RaceStateUpdate;

      expect(msg1.participants).toHaveLength(2);
      expect(msg2.participants).toHaveLength(2);
    });

    it('should not duplicate participant on re-join', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );

      await waitForMessage(ws);

      ws.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );

      const msg = (await waitForMessage(ws)) as RaceStateUpdate;
      expect(msg.participants).toHaveLength(1);
    });
  });

  describe('race:leave', () => {
    it('should remove participant on leave', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      // Both join
      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1); // ws1 gets update
      await waitForMessage(ws2); // ws2 gets update

      // Alice leaves
      ws1.send(
        JSON.stringify({
          type: 'race:leave',
          raceId: 1,
          userId: 10,
        })
      );

      const msg = (await waitForMessage(ws2)) as RaceStateUpdate;
      expect(msg.participants).toHaveLength(1);
      expect(msg.participants[0].userId).toBe(20);
    });

    it('should remove room when last participant leaves', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws);

      expect(raceWs.getRoomCount()).toBe(1);

      ws.send(
        JSON.stringify({
          type: 'race:leave',
          raceId: 1,
          userId: 10,
        })
      );

      // Wait for the leave to be processed
      await new Promise((r) => setTimeout(r, 100));

      // Room should be gone
      expect(raceWs.getRoomCount()).toBe(0);
    });
  });

  describe('race:start', () => {
    it('should reject start with fewer than 2 participants', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws);

      ws.send(JSON.stringify({ type: 'race:start', raceId: 1 }));

      const msg = await waitForMessage(ws);
      expect(msg.type).toBe('error');
      expect((msg as ErrorMessage).message).toBe(
        'Need at least 2 players to start'
      );
    });

    it('should start countdown with 2+ participants', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      ws1.send(JSON.stringify({ type: 'race:start', raceId: 1 }));

      // Should receive countdown state (count: 3)
      const msg = (await waitForMessage(ws1)) as RaceStateUpdate;
      expect(msg.type).toBe('race:state');
      expect(msg.status).toBe('countdown');
      expect(msg.countdownValue).toBe(3);
    });

    it('should reject start if race already started', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      // Join both
      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      // First start
      ws1.send(JSON.stringify({ type: 'race:start', raceId: 1 }));
      await waitForMessage(ws1); // countdown 3

      // Try to start again
      ws2.send(JSON.stringify({ type: 'race:start', raceId: 1 }));
      const msg = await waitForMessage(ws2);

      // Should be either an error or a countdown message from the ongoing countdown
      if (msg.type === 'error') {
        expect((msg as ErrorMessage).message).toBe('Race has already started');
      } else {
        // It received the next countdown tick
        expect(msg.type).toBe('race:state');
      }
    });
  });

  describe('race:progress', () => {
    it('should broadcast progress updates', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      // Join both
      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      // Send progress
      ws1.send(
        JSON.stringify({
          type: 'race:progress',
          raceId: 1,
          userId: 10,
          progress: 50,
          currentWpm: 75,
        })
      );

      const msg = (await waitForMessage(ws2)) as RaceStateUpdate;
      expect(msg.type).toBe('race:state');

      const alice = msg.participants.find((p) => p.userId === 10);
      expect(alice?.progress).toBe(50);
      expect(alice?.currentWpm).toBe(75);
    });
  });

  describe('race:finish', () => {
    it('should record finish and assign rank', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      // Join
      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      // Alice finishes first
      ws1.send(
        JSON.stringify({
          type: 'race:finish',
          raceId: 1,
          userId: 10,
          wpm: 85,
          accuracy: 97,
        })
      );

      const msg1 = (await waitForMessage(ws1)) as RaceStateUpdate;
      const alice = msg1.participants.find((p) => p.userId === 10);
      expect(alice?.rank).toBe(1);
      expect(alice?.wpm).toBe(85);
      expect(alice?.accuracy).toBe(97);
      expect(alice?.finishedAt).toBeTruthy();
      expect(alice?.progress).toBe(100);
    });

    it('should mark race as finished when all complete', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      // Join
      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      // Both finish
      ws1.send(
        JSON.stringify({
          type: 'race:finish',
          raceId: 1,
          userId: 10,
          wpm: 85,
          accuracy: 97,
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      ws2.send(
        JSON.stringify({
          type: 'race:finish',
          raceId: 1,
          userId: 20,
          wpm: 72,
          accuracy: 94,
        })
      );

      const msg = (await waitForMessage(ws1)) as RaceStateUpdate;
      expect(msg.status).toBe('finished');

      const bob = msg.participants.find((p) => p.userId === 20);
      expect(bob?.rank).toBe(2);
    });
  });

  describe('lobby subscription', () => {
    it('should notify lobby subscribers on race join', async () => {
      const lobbyClient = newClient();
      const raceClient = newClient();
      await Promise.all([waitForOpen(lobbyClient), waitForOpen(raceClient)]);

      // Subscribe to lobby
      lobbyClient.send(JSON.stringify({ type: 'lobby:subscribe' }));

      // Small delay to ensure subscription is processed
      await new Promise((r) => setTimeout(r, 50));

      // Join a race
      raceClient.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );

      const msg = (await waitForMessage(lobbyClient)) as LobbyUpdate;
      expect(msg.type).toBe('lobby:update');
      expect(msg.raceId).toBe(1);
      expect(msg.action).toBe('updated');
      expect(msg.participantCount).toBe(1);
    });

    it('should notify lobby on room removal', async () => {
      const lobbyClient = newClient();
      const raceClient = newClient();
      await Promise.all([waitForOpen(lobbyClient), waitForOpen(raceClient)]);

      lobbyClient.send(JSON.stringify({ type: 'lobby:subscribe' }));
      await new Promise((r) => setTimeout(r, 50));

      // Collect all lobby messages
      const lobbyMessages: ServerMessage[] = [];
      lobbyClient.on('message', (data) => {
        lobbyMessages.push(JSON.parse(data.toString()));
      });

      // Join then leave
      raceClient.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(raceClient); // state update

      // Wait for join lobby update
      await new Promise((r) => setTimeout(r, 100));

      raceClient.send(
        JSON.stringify({
          type: 'race:leave',
          raceId: 1,
          userId: 10,
        })
      );

      // Wait for removal lobby update
      await new Promise((r) => setTimeout(r, 200));

      const removedMsg = lobbyMessages.find(
        (m) => m.type === 'lobby:update' && (m as LobbyUpdate).action === 'removed'
      ) as LobbyUpdate | undefined;
      expect(removedMsg).toBeDefined();
      expect(removedMsg!.raceId).toBe(1);
    });

    it('should stop notifying after unsubscribe', async () => {
      const lobbyClient = newClient();
      const raceClient = newClient();
      await Promise.all([waitForOpen(lobbyClient), waitForOpen(raceClient)]);

      lobbyClient.send(JSON.stringify({ type: 'lobby:subscribe' }));
      await new Promise((r) => setTimeout(r, 50));

      lobbyClient.send(JSON.stringify({ type: 'lobby:unsubscribe' }));
      await new Promise((r) => setTimeout(r, 50));

      // Join a race
      raceClient.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );

      // The lobby client should NOT receive any message
      const result = await Promise.race([
        waitForMessage(lobbyClient).then(() => 'received'),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('timeout'), 500)
        ),
      ]);

      expect(result).toBe('timeout');
    });
  });

  describe('disconnect handling', () => {
    it('should remove participant from waiting race on disconnect', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      // Alice disconnects
      ws1.close();

      // Bob should receive updated state
      const msg = (await waitForMessage(ws2)) as RaceStateUpdate;
      expect(msg.participants).toHaveLength(1);
      expect(msg.participants[0].userId).toBe(20);
    });

    it('should delete room when last participant disconnects', async () => {
      const ws = newClient();
      await waitForOpen(ws);

      ws.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws);

      expect(raceWs.getRoomCount()).toBe(1);

      ws.close();

      // Wait for close to be processed
      await new Promise((r) => setTimeout(r, 100));

      expect(raceWs.getRoomCount()).toBe(0);
    });
  });

  describe('room management', () => {
    it('should track multiple rooms independently', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 2,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws2);

      expect(raceWs.getRoomCount()).toBe(2);

      const room1 = raceWs.getRoom(1);
      const room2 = raceWs.getRoom(2);
      expect(room1?.participants.size).toBe(1);
      expect(room2?.participants.size).toBe(1);
    });

    it('should isolate progress updates to correct room', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      // Join different rooms
      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 2,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws2);

      // Send progress in room 1
      ws1.send(
        JSON.stringify({
          type: 'race:progress',
          raceId: 1,
          userId: 10,
          progress: 50,
          currentWpm: 60,
        })
      );

      // ws1 should receive update
      const msg = (await waitForMessage(ws1)) as RaceStateUpdate;
      expect(msg.raceId).toBe(1);

      // ws2 should NOT receive update from room 1
      const result = await Promise.race([
        waitForMessage(ws2).then(() => 'received'),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('timeout'), 500)
        ),
      ]);
      expect(result).toBe('timeout');
    });
  });

  describe('countdown flow', () => {
    it('should count down from 3 to 0 and transition to in_progress', async () => {
      const ws1 = newClient();
      const ws2 = newClient();
      await Promise.all([waitForOpen(ws1), waitForOpen(ws2)]);

      ws1.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 10,
          userName: 'Alice',
        })
      );
      await waitForMessage(ws1);

      ws2.send(
        JSON.stringify({
          type: 'race:join',
          raceId: 1,
          userId: 20,
          userName: 'Bob',
        })
      );
      await waitForMessage(ws1);
      await waitForMessage(ws2);

      // Collect all messages from ws1 after starting
      const messages: RaceStateUpdate[] = [];
      ws1.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'race:state') {
          messages.push(msg);
        }
      });

      ws1.send(JSON.stringify({ type: 'race:start', raceId: 1 }));

      // Wait for countdown to complete (3s + buffer)
      await new Promise((r) => setTimeout(r, 5000));

      // Should have received: countdown 3, 2, 1, 0, then in_progress
      expect(messages.length).toBeGreaterThanOrEqual(5);

      // Check countdown values
      const countdownMessages = messages.filter(
        (m) => m.status === 'countdown'
      );
      expect(countdownMessages.map((m) => m.countdownValue)).toEqual([
        3, 2, 1, 0,
      ]);

      // Check final in_progress
      const inProgressMsg = messages.find((m) => m.status === 'in_progress');
      expect(inProgressMsg).toBeDefined();
    }, 15000);
  });
});
