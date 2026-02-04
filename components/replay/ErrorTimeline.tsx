'use client';

import { useMemo } from 'react';

export interface ErrorMarker {
  timestamp: number;
  position: number;
  expected: string;
  actual: string;
}

interface ErrorTimelineProps {
  errorMarkers: ErrorMarker[];
  totalDuration: number;
  currentTime: number;
}

export function ErrorTimeline({ errorMarkers, totalDuration, currentTime }: ErrorTimelineProps) {
  // Cluster nearby errors to avoid overlapping markers
  const clusters = useMemo(() => {
    if (errorMarkers.length === 0 || totalDuration === 0) return [];

    const CLUSTER_THRESHOLD_PCT = 1.5; // markers within 1.5% of timeline are clustered
    const sorted = [...errorMarkers].sort((a, b) => a.position - b.position);

    const result: Array<{
      position: number;
      count: number;
      timestamps: number[];
    }> = [];

    let current = {
      position: sorted[0].position,
      count: 1,
      timestamps: [sorted[0].timestamp],
    };

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].position - current.position <= CLUSTER_THRESHOLD_PCT) {
        current.count++;
        current.timestamps.push(sorted[i].timestamp);
        // Average position for cluster
        current.position =
          current.timestamps.reduce(
            (sum, t) => sum + (totalDuration > 0 ? (t / totalDuration) * 100 : 0),
            0
          ) / current.timestamps.length;
      } else {
        result.push(current);
        current = {
          position: sorted[i].position,
          count: 1,
          timestamps: [sorted[i].timestamp],
        };
      }
    }
    result.push(current);
    return result;
  }, [errorMarkers, totalDuration]);

  if (errorMarkers.length === 0 || totalDuration === 0) return null;

  const currentPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
      data-testid="error-timeline"
    >
      {clusters.map((cluster, idx) => {
        const isPast = cluster.position <= currentPct;
        return (
          <div
            key={idx}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${cluster.position}%` }}
            data-testid={`error-marker-${idx}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isPast ? 'bg-red-500' : 'bg-red-500/40'
              }`}
              style={{
                transform: cluster.count > 1 ? `scale(${Math.min(1 + cluster.count * 0.2, 2)})` : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
