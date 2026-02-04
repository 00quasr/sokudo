'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  ClientMessage,
  RaceStateUpdate,
  LobbyUpdate,
  ParticipantState,
  ServerMessage,
} from './race-server';

export type { ParticipantState, RaceStateUpdate, LobbyUpdate, ServerMessage };

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/race`;
}

interface UseRaceSocketOptions {
  raceId: number;
  userId: number;
  userName: string;
  onStateUpdate?: (state: RaceStateUpdate) => void;
  onError?: (message: string) => void;
}

interface UseRaceSocketReturn {
  connected: boolean;
  raceState: RaceStateUpdate | null;
  sendProgress: (progress: number, currentWpm: number) => void;
  sendFinish: (wpm: number, accuracy: number) => void;
  sendAdvanceChallenge: (challengeWpm: number, challengeAccuracy: number) => void;
  sendStart: () => void;
  sendLeave: () => void;
}

export function useRaceSocket({
  raceId,
  userId,
  userName,
  onStateUpdate,
  onError,
}: UseRaceSocketOptions): UseRaceSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [raceState, setRaceState] = useState<RaceStateUpdate | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);
  const onErrorRef = useRef(onError);

  onStateUpdateRef.current = onStateUpdate;
  onErrorRef.current = onError;

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    function connect() {
      const url = getWsUrl();
      if (!url) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setConnected(true);

        // Join the race room
        send({
          type: 'race:join',
          raceId,
          userId,
          userName,
        });
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === 'race:state') {
            setRaceState(message);
            onStateUpdateRef.current?.(message);
          } else if (message.type === 'error') {
            onErrorRef.current?.(message.message);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        setConnected(false);
        // Reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mounted) connect();
        }, 2000);
      };

      ws.onerror = () => {
        // onclose will fire after this, handling reconnection
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Send leave before closing
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: 'race:leave', raceId, userId })
          );
        }
        wsRef.current.close();
      }
    };
  }, [raceId, userId, userName, send]);

  const sendProgress = useCallback(
    (progress: number, currentWpm: number) => {
      send({ type: 'race:progress', raceId, userId, progress, currentWpm });
    },
    [raceId, userId, send]
  );

  const sendFinish = useCallback(
    (wpm: number, accuracy: number) => {
      send({ type: 'race:finish', raceId, userId, wpm, accuracy });
    },
    [raceId, userId, send]
  );

  const sendAdvanceChallenge = useCallback(
    (challengeWpm: number, challengeAccuracy: number) => {
      send({ type: 'race:advanceChallenge', raceId, userId, challengeWpm, challengeAccuracy });
    },
    [raceId, userId, send]
  );

  const sendStart = useCallback(() => {
    send({ type: 'race:start', raceId });
  }, [raceId, send]);

  const sendLeave = useCallback(() => {
    send({ type: 'race:leave', raceId, userId });
  }, [raceId, userId, send]);

  return {
    connected,
    raceState,
    sendProgress,
    sendFinish,
    sendAdvanceChallenge,
    sendStart,
    sendLeave,
  };
}

// --- Lobby hook ---

interface UseLobbySocketOptions {
  onLobbyUpdate?: (update: LobbyUpdate) => void;
}

interface UseLobbySocketReturn {
  connected: boolean;
}

export function useLobbySocket({
  onLobbyUpdate,
}: UseLobbySocketOptions): UseLobbySocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLobbyUpdateRef = useRef(onLobbyUpdate);

  onLobbyUpdateRef.current = onLobbyUpdate;

  useEffect(() => {
    let mounted = true;

    function connect() {
      const url = getWsUrl();
      if (!url) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setConnected(true);
        ws.send(JSON.stringify({ type: 'lobby:subscribe' }));
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === 'lobby:update') {
            onLobbyUpdateRef.current?.(message);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mounted) connect();
        }, 2000);
      };

      ws.onerror = () => {
        // onclose will fire after this
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'lobby:unsubscribe' }));
        }
        wsRef.current.close();
      }
    };
  }, []);

  return { connected };
}

// --- Spectator hook ---

interface UseSpectatorSocketOptions {
  raceId: number;
  onStateUpdate?: (state: RaceStateUpdate) => void;
  onError?: (message: string) => void;
}

interface UseSpectatorSocketReturn {
  connected: boolean;
  raceState: RaceStateUpdate | null;
}

export function useSpectatorSocket({
  raceId,
  onStateUpdate,
  onError,
}: UseSpectatorSocketOptions): UseSpectatorSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [raceState, setRaceState] = useState<RaceStateUpdate | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStateUpdateRef = useRef(onStateUpdate);
  const onErrorRef = useRef(onError);

  onStateUpdateRef.current = onStateUpdate;
  onErrorRef.current = onError;

  useEffect(() => {
    let mounted = true;

    function connect() {
      const url = getWsUrl();
      if (!url) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setConnected(true);

        // Join as spectator
        ws.send(
          JSON.stringify({
            type: 'race:spectate',
            raceId,
          })
        );
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === 'race:state') {
            setRaceState(message);
            onStateUpdateRef.current?.(message);
          } else if (message.type === 'error') {
            onErrorRef.current?.(message.message);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mounted) connect();
        }, 2000);
      };

      ws.onerror = () => {
        // onclose will fire after this, handling reconnection
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: 'race:unspectate', raceId })
          );
        }
        wsRef.current.close();
      }
    };
  }, [raceId]);

  return {
    connected,
    raceState,
  };
}
