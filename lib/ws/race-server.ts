import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server as HttpServer } from 'http';

// --- Message types ---

export interface RaceJoinMessage {
  type: 'race:join';
  raceId: number;
  userId: number;
  userName: string;
}

export interface RaceLeaveMessage {
  type: 'race:leave';
  raceId: number;
  userId: number;
}

export interface RaceStartMessage {
  type: 'race:start';
  raceId: number;
}

export interface RaceProgressMessage {
  type: 'race:progress';
  raceId: number;
  userId: number;
  progress: number; // 0-100 percentage
  currentWpm: number;
}

export interface RaceFinishMessage {
  type: 'race:finish';
  raceId: number;
  userId: number;
  wpm: number;
  accuracy: number;
}

export interface RaceAdvanceChallengeMessage {
  type: 'race:advanceChallenge';
  raceId: number;
  userId: number;
  challengeWpm: number;
  challengeAccuracy: number;
}

export interface RaceCountdownMessage {
  type: 'race:countdown';
  raceId: number;
  count: number; // 3, 2, 1, 0
}

export interface LobbySubscribeMessage {
  type: 'lobby:subscribe';
}

export interface LobbyUnsubscribeMessage {
  type: 'lobby:unsubscribe';
}

export interface MatchmakingJoinMessage {
  type: 'matchmaking:join';
  userId: number;
  userName: string;
}

export interface MatchmakingLeaveMessage {
  type: 'matchmaking:leave';
  userId: number;
}

export interface RaceSpectateMessage {
  type: 'race:spectate';
  raceId: number;
}

export interface RaceUnspectateMessage {
  type: 'race:unspectate';
  raceId: number;
}

export type ClientMessage =
  | RaceJoinMessage
  | RaceLeaveMessage
  | RaceStartMessage
  | RaceProgressMessage
  | RaceFinishMessage
  | RaceAdvanceChallengeMessage
  | RaceCountdownMessage
  | LobbySubscribeMessage
  | LobbyUnsubscribeMessage
  | MatchmakingJoinMessage
  | MatchmakingLeaveMessage
  | RaceSpectateMessage
  | RaceUnspectateMessage;

// --- Server broadcast messages ---

export interface RaceStateUpdate {
  type: 'race:state';
  raceId: number;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  participants: ParticipantState[];
  countdownValue?: number;
  startTime?: number; // Unix ms timestamp when race starts (after countdown)
  spectatorCount?: number;
}

export interface ParticipantState {
  userId: number;
  userName: string;
  progress: number;
  currentWpm: number;
  currentChallengeIndex: number;
  wpm: number | null;
  accuracy: number | null;
  finishedAt: string | null;
  rank: number | null;
}

export interface LobbyUpdate {
  type: 'lobby:update';
  raceId: number;
  action: 'created' | 'updated' | 'removed';
  participantCount?: number;
  status?: string;
}

export interface MatchmakingStatusUpdate {
  type: 'matchmaking:status';
  status: 'queued' | 'matched' | 'cancelled';
  averageWpm?: number;
  queueSize?: number;
  raceId?: number;
  players?: Array<{ userId: number; userName: string; averageWpm: number }>;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ServerMessage =
  | RaceStateUpdate
  | LobbyUpdate
  | MatchmakingStatusUpdate
  | ErrorMessage;

// --- Internal state ---

interface RaceRoom {
  raceId: number;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  participants: Map<number, ParticipantState>;
  clients: Set<WebSocket>;
  spectators: Set<WebSocket>;
  countdownTimer?: ReturnType<typeof setTimeout>;
  startTime?: number; // Unix ms timestamp when race will start
}

interface ExtendedWebSocket extends WebSocket {
  raceId?: number;
  userId?: number;
  isAlive?: boolean;
  subscribedToLobby?: boolean;
  inMatchmaking?: boolean;
  isSpectator?: boolean;
}

// --- Race WebSocket Server ---

export class RaceWebSocketServer {
  private wss: WebSocketServer;
  private rooms: Map<number, RaceRoom> = new Map();
  private lobbySubscribers: Set<ExtendedWebSocket> = new Set();
  private matchmakingClients: Map<number, ExtendedWebSocket> = new Map(); // userId -> ws
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws/race' });
    this.wss.on('connection', this.handleConnection.bind(this));
    this.startPingInterval();
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as ExtendedWebSocket;
        if (client.isAlive === false) {
          this.handleDisconnect(client);
          client.terminate();
          return;
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  private handleConnection(ws: WebSocket, _req: IncomingMessage): void {
    const client = ws as ExtendedWebSocket;
    client.isAlive = true;

    client.on('pong', () => {
      client.isAlive = true;
    });

    client.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as ClientMessage;
        this.handleMessage(client, message);
      } catch {
        this.sendToClient(client, {
          type: 'error',
          message: 'Invalid message format',
        });
      }
    });

    client.on('close', () => {
      this.handleDisconnect(client);
    });
  }

  handleMessage(client: ExtendedWebSocket, message: ClientMessage): void {
    switch (message.type) {
      case 'race:join':
        this.handleJoin(client, message);
        break;
      case 'race:leave':
        this.handleLeave(client, message);
        break;
      case 'race:start':
        this.handleStart(client, message);
        break;
      case 'race:progress':
        this.handleProgress(client, message);
        break;
      case 'race:finish':
        this.handleFinish(client, message);
        break;
      case 'race:advanceChallenge':
        this.handleAdvanceChallenge(client, message);
        break;
      case 'race:countdown':
        this.handleCountdown(client, message);
        break;
      case 'lobby:subscribe':
        this.handleLobbySubscribe(client);
        break;
      case 'lobby:unsubscribe':
        this.handleLobbyUnsubscribe(client);
        break;
      case 'matchmaking:join':
        this.handleMatchmakingJoin(client, message);
        break;
      case 'matchmaking:leave':
        this.handleMatchmakingLeave(client, message);
        break;
      case 'race:spectate':
        this.handleSpectate(client, message);
        break;
      case 'race:unspectate':
        this.handleUnspectate(client, message);
        break;
      default:
        this.sendToClient(client, {
          type: 'error',
          message: 'Unknown message type',
        });
    }
  }

  private handleJoin(
    client: ExtendedWebSocket,
    message: RaceJoinMessage
  ): void {
    const { raceId, userId, userName } = message;

    // Create room if it doesn't exist
    if (!this.rooms.has(raceId)) {
      this.rooms.set(raceId, {
        raceId,
        status: 'waiting',
        participants: new Map(),
        clients: new Set(),
        spectators: new Set(),
      });
    }

    const room = this.rooms.get(raceId)!;

    // Add participant state
    if (!room.participants.has(userId)) {
      room.participants.set(userId, {
        userId,
        userName,
        progress: 0,
        currentWpm: 0,
        currentChallengeIndex: 0,
        wpm: null,
        accuracy: null,
        finishedAt: null,
        rank: null,
      });
    }

    // Track the client's room and userId
    client.raceId = raceId;
    client.userId = userId;
    room.clients.add(client);

    // Broadcast updated state to all clients in the room
    this.broadcastRaceState(room);

    // Notify lobby subscribers
    this.broadcastLobbyUpdate({
      type: 'lobby:update',
      raceId,
      action: 'updated',
      participantCount: room.participants.size,
      status: room.status,
    });
  }

  private handleLeave(
    client: ExtendedWebSocket,
    message: RaceLeaveMessage
  ): void {
    const { raceId, userId } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    room.participants.delete(userId);
    room.clients.delete(client);
    client.raceId = undefined;
    client.userId = undefined;

    if (room.participants.size === 0) {
      if (room.countdownTimer) {
        clearTimeout(room.countdownTimer);
      }
      this.rooms.delete(raceId);
      this.broadcastLobbyUpdate({
        type: 'lobby:update',
        raceId,
        action: 'removed',
      });
    } else {
      this.broadcastRaceState(room);
      this.broadcastLobbyUpdate({
        type: 'lobby:update',
        raceId,
        action: 'updated',
        participantCount: room.participants.size,
        status: room.status,
      });
    }
  }

  private handleStart(
    client: ExtendedWebSocket,
    message: RaceStartMessage
  ): void {
    const { raceId } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    if (room.status !== 'waiting') {
      this.sendToClient(client, {
        type: 'error',
        message: 'Race has already started',
      });
      return;
    }

    if (room.participants.size < 2) {
      this.sendToClient(client, {
        type: 'error',
        message: 'Need at least 2 players to start',
      });
      return;
    }

    // Calculate the absolute start time (now + countdown seconds + small buffer)
    const countdownSeconds = 3;
    room.startTime = Date.now() + (countdownSeconds + 1) * 1000;

    // Start countdown
    room.status = 'countdown';
    this.runCountdown(room, countdownSeconds);
  }

  private runCountdown(room: RaceRoom, count: number): void {
    // Broadcast countdown state
    const stateUpdate = this.buildRaceState(room);
    stateUpdate.countdownValue = count;
    this.broadcastToRoom(room, stateUpdate);

    if (count > 0) {
      room.countdownTimer = setTimeout(() => {
        this.runCountdown(room, count - 1);
      }, 1000);
    } else {
      // Countdown finished, start the race
      room.status = 'in_progress';
      this.broadcastRaceState(room);
      this.broadcastLobbyUpdate({
        type: 'lobby:update',
        raceId: room.raceId,
        action: 'updated',
        participantCount: room.participants.size,
        status: 'in_progress',
      });
    }
  }

  private handleCountdown(
    client: ExtendedWebSocket,
    message: RaceCountdownMessage
  ): void {
    const { raceId, count } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    // Broadcast countdown to all room clients
    const stateUpdate = this.buildRaceState(room);
    stateUpdate.countdownValue = count;
    this.broadcastToRoom(room, stateUpdate);
  }

  private handleProgress(
    _client: ExtendedWebSocket,
    message: RaceProgressMessage
  ): void {
    const { raceId, userId, progress, currentWpm } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant) return;

    participant.progress = progress;
    participant.currentWpm = currentWpm;

    this.broadcastRaceState(room);
  }

  private handleFinish(
    _client: ExtendedWebSocket,
    message: RaceFinishMessage
  ): void {
    const { raceId, userId, wpm, accuracy } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant) return;

    // Calculate rank based on finish order
    const finishedCount = Array.from(room.participants.values()).filter(
      (p) => p.finishedAt !== null
    ).length;

    participant.wpm = wpm;
    participant.accuracy = accuracy;
    participant.finishedAt = new Date().toISOString();
    participant.rank = finishedCount + 1;
    participant.progress = 100;

    // Check if all participants have finished
    const allFinished = Array.from(room.participants.values()).every(
      (p) => p.finishedAt !== null
    );

    if (allFinished) {
      room.status = 'finished';
      this.broadcastLobbyUpdate({
        type: 'lobby:update',
        raceId,
        action: 'removed',
      });
    }

    this.broadcastRaceState(room);
  }

  private handleAdvanceChallenge(
    _client: ExtendedWebSocket,
    message: RaceAdvanceChallengeMessage
  ): void {
    const { raceId, userId } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant) return;

    // Increment challenge index and reset progress
    participant.currentChallengeIndex += 1;
    participant.progress = 0;
    participant.currentWpm = 0;

    this.broadcastRaceState(room);
  }

  private handleSpectate(
    client: ExtendedWebSocket,
    message: RaceSpectateMessage
  ): void {
    const { raceId } = message;
    const room = this.rooms.get(raceId);
    if (!room) {
      this.sendToClient(client, {
        type: 'error',
        message: 'Race not found',
      });
      return;
    }

    client.raceId = raceId;
    client.isSpectator = true;
    room.clients.add(client);
    room.spectators.add(client);

    // Send current race state to the spectator
    this.broadcastRaceState(room);
  }

  private handleUnspectate(
    client: ExtendedWebSocket,
    message: RaceUnspectateMessage
  ): void {
    const { raceId } = message;
    const room = this.rooms.get(raceId);
    if (!room) return;

    room.spectators.delete(client);
    room.clients.delete(client);
    client.raceId = undefined;
    client.isSpectator = false;

    // Broadcast updated spectator count
    this.broadcastRaceState(room);
  }

  private handleLobbySubscribe(client: ExtendedWebSocket): void {
    client.subscribedToLobby = true;
    this.lobbySubscribers.add(client);
  }

  private handleLobbyUnsubscribe(client: ExtendedWebSocket): void {
    client.subscribedToLobby = false;
    this.lobbySubscribers.delete(client);
  }

  private handleMatchmakingJoin(
    client: ExtendedWebSocket,
    message: MatchmakingJoinMessage
  ): void {
    const { userId, userName } = message;
    client.userId = userId;
    client.inMatchmaking = true;
    this.matchmakingClients.set(userId, client);

    // Import and use the matchmaking queue
    import('@/lib/matchmaking/queue').then(async ({ getMatchmakingQueue, pickMatchCategory, createMatchedRace }) => {
      const queue = getMatchmakingQueue();

      if (queue.isInQueue(userId)) {
        this.sendToClient(client, {
          type: 'error',
          message: 'Already in matchmaking queue',
        });
        return;
      }

      const entry = await queue.addPlayer(userId, userName);

      this.sendToClient(client, {
        type: 'matchmaking:status',
        status: 'queued',
        averageWpm: entry.averageWpm,
        queueSize: queue.getQueueSize(),
      });

      // Set up match callback if not already set
      queue.setOnMatch(async (result) => {
        const groupAvgWpm =
          result.players.reduce((sum, p) => sum + p.averageWpm, 0) /
          result.players.length;
        const categoryId = await pickMatchCategory(groupAvgWpm);

        if (!categoryId) return;

        const raceId = await createMatchedRace(result.players, categoryId);

        // Notify all matched players via WebSocket
        for (const player of result.players) {
          const playerClient = this.matchmakingClients.get(player.userId);
          if (playerClient && playerClient.readyState === WebSocket.OPEN) {
            this.sendToClient(playerClient, {
              type: 'matchmaking:status',
              status: 'matched',
              raceId,
              players: result.players.map((p) => ({
                userId: p.userId,
                userName: p.userName,
                averageWpm: p.averageWpm,
              })),
            });
            playerClient.inMatchmaking = false;
            this.matchmakingClients.delete(player.userId);
          }
        }

        // Notify lobby subscribers about the new race
        this.broadcastLobbyUpdate({
          type: 'lobby:update',
          raceId,
          action: 'created',
          participantCount: result.players.length,
          status: 'waiting',
        });
      });

      // Try matching immediately
      const match = queue.tryMatch();
      if (match) {
        const groupAvgWpm =
          match.players.reduce((sum, p) => sum + p.averageWpm, 0) /
          match.players.length;
        const categoryId = await pickMatchCategory(groupAvgWpm);

        if (categoryId) {
          const raceId = await createMatchedRace(match.players, categoryId);

          for (const player of match.players) {
            const playerClient = this.matchmakingClients.get(player.userId);
            if (playerClient && playerClient.readyState === WebSocket.OPEN) {
              this.sendToClient(playerClient, {
                type: 'matchmaking:status',
                status: 'matched',
                raceId,
                players: match.players.map((p) => ({
                  userId: p.userId,
                  userName: p.userName,
                  averageWpm: p.averageWpm,
                })),
              });
              playerClient.inMatchmaking = false;
              this.matchmakingClients.delete(player.userId);
            }
          }

          this.broadcastLobbyUpdate({
            type: 'lobby:update',
            raceId,
            action: 'created',
            participantCount: match.players.length,
            status: 'waiting',
          });
        }
      }
    }).catch(() => {
      this.sendToClient(client, {
        type: 'error',
        message: 'Matchmaking service unavailable',
      });
    });
  }

  private handleMatchmakingLeave(
    client: ExtendedWebSocket,
    message: MatchmakingLeaveMessage
  ): void {
    const { userId } = message;
    client.inMatchmaking = false;
    this.matchmakingClients.delete(userId);

    import('@/lib/matchmaking/queue').then(({ getMatchmakingQueue }) => {
      const queue = getMatchmakingQueue();
      queue.removePlayer(userId);

      this.sendToClient(client, {
        type: 'matchmaking:status',
        status: 'cancelled',
      });
    }).catch(() => {
      // Silently fail
    });
  }

  private handleDisconnect(client: ExtendedWebSocket): void {
    // Remove from lobby subscribers
    this.lobbySubscribers.delete(client);

    // Remove from matchmaking if in queue
    if (client.inMatchmaking && client.userId !== undefined) {
      this.matchmakingClients.delete(client.userId);
      import('@/lib/matchmaking/queue').then(({ getMatchmakingQueue }) => {
        getMatchmakingQueue().removePlayer(client.userId!);
      }).catch(() => {});
    }

    // Remove from race room if in one
    if (client.raceId !== undefined) {
      const room = this.rooms.get(client.raceId);
      if (room) {
        room.clients.delete(client);

        // If spectator, just remove from spectators set
        if (client.isSpectator) {
          room.spectators.delete(client);
          if (room.participants.size > 0) {
            this.broadcastRaceState(room);
          }
        } else if (client.userId !== undefined && room.status === 'waiting') {
          // If user was a participant and race is waiting, remove them
          room.participants.delete(client.userId);

          if (room.participants.size === 0) {
            if (room.countdownTimer) {
              clearTimeout(room.countdownTimer);
            }
            this.rooms.delete(client.raceId);
            this.broadcastLobbyUpdate({
              type: 'lobby:update',
              raceId: client.raceId,
              action: 'removed',
            });
          } else {
            this.broadcastRaceState(room);
            this.broadcastLobbyUpdate({
              type: 'lobby:update',
              raceId: client.raceId,
              action: 'updated',
              participantCount: room.participants.size,
              status: room.status,
            });
          }
        }
      }
    }
  }

  private buildRaceState(room: RaceRoom): RaceStateUpdate {
    const state: RaceStateUpdate = {
      type: 'race:state',
      raceId: room.raceId,
      status: room.status,
      participants: Array.from(room.participants.values()),
      spectatorCount: room.spectators.size,
    };
    if (room.startTime !== undefined) {
      state.startTime = room.startTime;
    }
    return state;
  }

  private broadcastRaceState(room: RaceRoom): void {
    const state = this.buildRaceState(room);
    this.broadcastToRoom(room, state);
  }

  private broadcastToRoom(room: RaceRoom, message: ServerMessage): void {
    const data = JSON.stringify(message);
    room.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private broadcastLobbyUpdate(message: LobbyUpdate): void {
    const data = JSON.stringify(message);
    this.lobbySubscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private sendToClient(client: ExtendedWebSocket, message: ServerMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  getRoom(raceId: number): RaceRoom | undefined {
    return this.rooms.get(raceId);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getSpectatorCount(raceId: number): number {
    const room = this.rooms.get(raceId);
    return room ? room.spectators.size : 0;
  }

  close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.rooms.forEach((room) => {
      if (room.countdownTimer) {
        clearTimeout(room.countdownTimer);
      }
    });
    this.wss.close();
  }
}
