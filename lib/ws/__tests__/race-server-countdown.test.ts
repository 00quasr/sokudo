import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { WebSocket } from 'ws';
import { RaceWebSocketServer } from '../race-server';
import type {
  RaceStateUpdate,
} from '../race-server';

/**
 * Tests for the RaceWebSocketServer countdown and start sync logic.
 * We create a real HTTP server + WebSocket server and connect real WebSocket clients.
 */

let httpServer: ReturnType<typeof createServer>;
let raceServer: RaceWebSocketServer;
let serverPort: number;

function getWsUrl(): string {
  return `ws://127.0.0.1:${serverPort}/ws/race`;
}

function connectClient(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(getWsUrl());
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function sendMessage(ws: WebSocket, msg: Record<string, unknown>): void {
  ws.send(JSON.stringify(msg));
}

function waitForMessage(ws: WebSocket, timeout = 2000): Promise<RaceStateUpdate> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for message')), timeout);
    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
}

function collectMessages(ws: WebSocket, count: number, timeout = 5000): Promise<RaceStateUpdate[]> {
  return new Promise((resolve, reject) => {
    const messages: RaceStateUpdate[] = [];
    const timer = setTimeout(() => reject(new Error(`Timeout: got ${messages.length}/${count} messages`)), timeout);

    function onMessage(data: Buffer | string) {
      messages.push(JSON.parse(data.toString()));
      if (messages.length >= count) {
        clearTimeout(timer);
        ws.removeListener('message', onMessage);
        resolve(messages);
      }
    }

    ws.on('message', onMessage);
  });
}

async function closeClient(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.on('close', () => resolve());
    ws.close();
  });
}

describe('RaceWebSocketServer - Countdown and Start Sync', () => {
  beforeEach(async () => {
    httpServer = createServer();
    raceServer = new RaceWebSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        const addr = httpServer.address();
        serverPort = typeof addr === 'object' && addr !== null ? addr.port : 0;
        resolve();
      });
    });
  });

  afterEach(async () => {
    raceServer.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  async function joinTwoPlayers(raceId = 1): Promise<{ client1: WebSocket; client2: WebSocket }> {
    const client1 = await connectClient();
    const client2 = await connectClient();

    // Both join the race
    const p1 = waitForMessage(client1);
    sendMessage(client1, { type: 'race:join', raceId, userId: 1, userName: 'Alice' });
    await p1;

    // Drain any messages from first join on client2
    // client2 joins
    const p2a = waitForMessage(client1);
    const p2b = waitForMessage(client2);
    sendMessage(client2, { type: 'race:join', raceId, userId: 2, userName: 'Bob' });
    await Promise.all([p2a, p2b]);

    return { client1, client2 };
  }

  describe('handleStart', () => {
    it('should transition room to countdown status and broadcast', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      const p1 = waitForMessage(client1);
      const p2 = waitForMessage(client2);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const [msg1, msg2] = await Promise.all([p1, p2]);

      expect(msg1.status).toBe('countdown');
      expect(msg1.countdownValue).toBe(3);
      expect(msg2.status).toBe('countdown');
      expect(msg2.countdownValue).toBe(3);

      await closeClient(client1);
      await closeClient(client2);
    });

    it('should include startTime in countdown broadcast', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      const p1 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const msg = await p1;

      expect(msg.startTime).toBeDefined();
      expect(typeof msg.startTime).toBe('number');
      // startTime should be in the future (roughly now + 4s)
      expect(msg.startTime!).toBeGreaterThan(Date.now() - 1000);

      await closeClient(client1);
      await closeClient(client2);
    });

    it('should reject start with less than 2 players', async () => {
      const client1 = await connectClient();

      const p1 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:join', raceId: 99, userId: 1, userName: 'Alice' });
      await p1;

      const p2 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:start', raceId: 99 });

      const errorMsg = await p2;
      expect(errorMsg).toEqual({
        type: 'error',
        message: 'Need at least 2 players to start',
      });

      await closeClient(client1);
    });

    it('should reject start if race already started', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      // Listen for countdown + error messages on client2 (it will get the broadcast + error)
      const client2Msgs = collectMessages(client2, 2, 5000);

      // Start countdown from client1
      const p1 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:start', raceId: 1 });
      await p1;

      // Now client2 tries to start again
      sendMessage(client2, { type: 'race:start', raceId: 1 });

      const received = await client2Msgs;

      // First message: countdown broadcast from client1's start
      expect(received[0].status).toBe('countdown');

      // Second message: error from client2's attempted start
      const errorMsg = received[1] as unknown as Record<string, unknown>;
      expect(errorMsg.type).toBe('error');
      expect(errorMsg.message).toBe('Race has already started');

      await closeClient(client1);
      await closeClient(client2);
    });
  });

  describe('countdown progression', () => {
    it('should count down from 3 to 0 and transition to in_progress', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      // Collect countdown messages (3, 2, 1, 0) + in_progress state = 5 messages
      const messagesPromise = collectMessages(client1, 5, 10000);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const messages = await messagesPromise;

      // First 4 messages should be countdown
      expect(messages[0].status).toBe('countdown');
      expect(messages[0].countdownValue).toBe(3);

      expect(messages[1].status).toBe('countdown');
      expect(messages[1].countdownValue).toBe(2);

      expect(messages[2].status).toBe('countdown');
      expect(messages[2].countdownValue).toBe(1);

      expect(messages[3].status).toBe('countdown');
      expect(messages[3].countdownValue).toBe(0);

      // Last message should be in_progress
      expect(messages[4].status).toBe('in_progress');

      await closeClient(client1);
      await closeClient(client2);
    }, 15000);

    it('should send same startTime in all countdown messages', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      // Collect the 4 countdown messages
      const messagesPromise = collectMessages(client1, 4, 10000);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const messages = await messagesPromise;

      const startTimes = messages
        .filter((m) => m.status === 'countdown')
        .map((m) => m.startTime);

      // All should be the same value
      expect(new Set(startTimes).size).toBe(1);
      expect(startTimes[0]).toBeDefined();

      await closeClient(client1);
      await closeClient(client2);
    }, 15000);

    it('should broadcast countdown to all clients in the room', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      const p1 = waitForMessage(client1);
      const p2 = waitForMessage(client2);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const [msg1, msg2] = await Promise.all([p1, p2]);

      expect(msg1.status).toBe('countdown');
      expect(msg1.countdownValue).toBe(3);
      expect(msg2.status).toBe('countdown');
      expect(msg2.countdownValue).toBe(3);

      // Both should have same startTime
      expect(msg1.startTime).toBe(msg2.startTime);

      await closeClient(client1);
      await closeClient(client2);
    });
  });

  describe('participant state during countdown', () => {
    it('should maintain participant list during countdown', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      const p1 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const msg = await p1;

      expect(msg.participants).toHaveLength(2);
      const names = msg.participants.map((p) => p.userName).sort();
      expect(names).toEqual(['Alice', 'Bob']);

      await closeClient(client1);
      await closeClient(client2);
    });

    it('should have all participants at 0 progress during countdown', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      const p1 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:start', raceId: 1 });

      const msg = await p1;

      for (const p of msg.participants) {
        expect(p.progress).toBe(0);
        expect(p.currentWpm).toBe(0);
        expect(p.wpm).toBeNull();
        expect(p.accuracy).toBeNull();
        expect(p.finishedAt).toBeNull();
      }

      await closeClient(client1);
      await closeClient(client2);
    });
  });

  describe('room state', () => {
    it('should track room status transitions', async () => {
      const { client1, client2 } = await joinTwoPlayers();

      // Before start
      let room = raceServer.getRoom(1);
      expect(room?.status).toBe('waiting');

      // After start
      const p1 = waitForMessage(client1);
      sendMessage(client1, { type: 'race:start', raceId: 1 });
      await p1;

      room = raceServer.getRoom(1);
      expect(room?.status).toBe('countdown');

      // Wait for countdown to finish
      const inProgressMsg = collectMessages(client1, 4, 10000);
      const messages = await inProgressMsg;
      const lastMsg = messages[messages.length - 1];

      // Should be in_progress after countdown completes
      room = raceServer.getRoom(1);
      expect(room?.status).toBe('in_progress');

      await closeClient(client1);
      await closeClient(client2);
    }, 15000);
  });
});
