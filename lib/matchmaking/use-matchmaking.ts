'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MatchmakingStatusUpdate, ServerMessage } from '@/lib/ws/race-server';

export type { MatchmakingStatusUpdate };

export type MatchmakingState = 'idle' | 'queued' | 'matched';

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/race`;
}

interface UseMatchmakingOptions {
  userId: number;
  userName: string;
  onMatched?: (raceId: number, players: MatchmakingStatusUpdate['players']) => void;
  onError?: (message: string) => void;
}

interface UseMatchmakingReturn {
  state: MatchmakingState;
  averageWpm: number | null;
  queueSize: number | null;
  raceId: number | null;
  players: MatchmakingStatusUpdate['players'] | null;
  joinQueue: () => void;
  leaveQueue: () => void;
  connected: boolean;
}

export function useMatchmaking({
  userId,
  userName,
  onMatched,
  onError,
}: UseMatchmakingOptions): UseMatchmakingReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<MatchmakingState>('idle');
  const [averageWpm, setAverageWpm] = useState<number | null>(null);
  const [queueSize, setQueueSize] = useState<number | null>(null);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [players, setPlayers] = useState<MatchmakingStatusUpdate['players'] | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMatchedRef = useRef(onMatched);
  const onErrorRef = useRef(onError);
  const shouldJoinRef = useRef(false);

  onMatchedRef.current = onMatched;
  onErrorRef.current = onError;

  const send = useCallback((message: Record<string, unknown>) => {
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

        // If we were trying to join, send the join message
        if (shouldJoinRef.current) {
          ws.send(
            JSON.stringify({
              type: 'matchmaking:join',
              userId,
              userName,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === 'matchmaking:status') {
            switch (message.status) {
              case 'queued':
                setState('queued');
                if (message.averageWpm !== undefined) setAverageWpm(message.averageWpm);
                if (message.queueSize !== undefined) setQueueSize(message.queueSize);
                break;
              case 'matched':
                setState('matched');
                if (message.raceId !== undefined) setRaceId(message.raceId);
                if (message.players) setPlayers(message.players);
                shouldJoinRef.current = false;
                onMatchedRef.current?.(message.raceId!, message.players);
                break;
              case 'cancelled':
                setState('idle');
                setAverageWpm(null);
                setQueueSize(null);
                shouldJoinRef.current = false;
                break;
            }
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
        if (wsRef.current.readyState === WebSocket.OPEN && shouldJoinRef.current) {
          wsRef.current.send(
            JSON.stringify({ type: 'matchmaking:leave', userId })
          );
        }
        wsRef.current.close();
      }
    };
  }, [userId, userName, send]);

  const joinQueue = useCallback(() => {
    shouldJoinRef.current = true;
    setState('queued');
    send({
      type: 'matchmaking:join',
      userId,
      userName,
    });
  }, [userId, userName, send]);

  const leaveQueue = useCallback(() => {
    shouldJoinRef.current = false;
    setState('idle');
    setAverageWpm(null);
    setQueueSize(null);
    send({
      type: 'matchmaking:leave',
      userId,
    });
  }, [userId, send]);

  return {
    state,
    averageWpm,
    queueSize,
    raceId,
    players,
    joinQueue,
    leaveQueue,
    connected,
  };
}
