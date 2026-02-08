'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';

export interface KeyAccuracyData {
  key: string;
  totalPresses: number;
  correctPresses: number;
  avgLatencyMs: number;
}

interface KeyboardHeatmapProps {
  data: KeyAccuracyData[];
  minPresses?: number;
}

const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
];

const KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  '`': '~',
  '-': '_',
  '=': '+',
  '[': '{',
  ']': '}',
  '\\': '|',
  ';': ':',
  "'": '"',
  ',': '<',
  '.': '>',
  '/': '?',
};

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 98) return 'bg-white/80';
  if (accuracy >= 95) return 'bg-white/60';
  if (accuracy >= 90) return 'bg-white/40';
  if (accuracy >= 85) return 'bg-white/30';
  if (accuracy >= 80) return 'bg-white/20';
  return 'bg-white/10';
}

function getAccuracyTextColor(accuracy: number): string {
  if (accuracy >= 98) return 'text-white';
  if (accuracy >= 95) return 'text-white/90';
  if (accuracy >= 90) return 'text-white/80';
  if (accuracy >= 85) return 'text-white/70';
  if (accuracy >= 80) return 'text-white/60';
  return 'text-white/50';
}

function getKeyWidth(key: string): string {
  if (key === ' ') return 'w-48';
  return 'w-10';
}

function getKeyOffset(rowIndex: number): string {
  if (rowIndex === 1) return 'ml-4';
  if (rowIndex === 2) return 'ml-8';
  if (rowIndex === 3) return 'ml-12';
  if (rowIndex === 4) return 'ml-0';
  return '';
}

export function KeyboardHeatmap({ data, minPresses = 5 }: KeyboardHeatmapProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const keyDataMap = new Map<string, KeyAccuracyData>();
  for (const item of data) {
    keyDataMap.set(item.key.toLowerCase(), item);
  }

  const getKeyData = (key: string): KeyAccuracyData | null => {
    return keyDataMap.get(key.toLowerCase()) || null;
  };

  const getKeyAccuracy = (key: string): number | null => {
    const keyData = getKeyData(key);
    if (!keyData || keyData.totalPresses < minPresses) return null;
    return Math.round((keyData.correctPresses / keyData.totalPresses) * 100);
  };

  const hoveredKeyData = hoveredKey ? getKeyData(hoveredKey) : null;
  const hoveredAccuracy = hoveredKey ? getKeyAccuracy(hoveredKey) : null;

  const hasData = data.length > 0;
  const significantKeys = data.filter((k) => k.totalPresses >= minPresses);

  if (!hasData) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white/[0.02] p-6">
      <div className="pb-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
          <Keyboard className="h-5 w-5 text-white/60" />
          Keyboard heatmap
        </h2>
      </div>
      <div className="space-y-4">
        {/* Keyboard visualization */}
        <div className="flex flex-col items-center gap-1 py-4">
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`flex gap-1 ${getKeyOffset(rowIndex)}`}
            >
              {row.map((key) => {
                const accuracy = getKeyAccuracy(key);
                const hasAccuracy = accuracy !== null;

                return (
                  <div
                    key={key}
                    className={`
                      ${getKeyWidth(key)}
                      h-10
                      rounded-md
                      flex items-center justify-center
                      font-mono text-sm
                      border border-white/[0.08]
                      cursor-pointer
                      transition-all duration-150
                      ${hasAccuracy ? getAccuracyColor(accuracy) : 'bg-white/[0.02]'}
                      ${hasAccuracy ? 'text-black' : 'text-white/30'}
                      ${hoveredKey === key ? 'ring-2 ring-white scale-110 z-10' : ''}
                    `}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    title={KEY_LABELS[key] || key.toUpperCase()}
                  >
                    {KEY_LABELS[key] || key.toUpperCase()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/10" />
            <span className="text-white/40">&lt;80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/30" />
            <span className="text-white/40">80-90%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/60" />
            <span className="text-white/40">90-98%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/80" />
            <span className="text-white/40">&ge;98%</span>
          </div>
        </div>

        {/* Tooltip / Detail panel */}
        {hoveredKey && (
          <div className="text-center p-3 bg-white/[0.04] rounded-lg border border-white/[0.08]">
            <div className="font-mono text-lg font-bold mb-1 text-white">
              {KEY_LABELS[hoveredKey] || hoveredKey.toUpperCase()}
            </div>
            {hoveredKeyData && hoveredKeyData.totalPresses >= minPresses ? (
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${getAccuracyTextColor(hoveredAccuracy!)}`}>
                  {hoveredAccuracy}% accuracy
                </div>
                <div className="text-sm text-white/40">
                  {hoveredKeyData.correctPresses} / {hoveredKeyData.totalPresses} correct
                </div>
                <div className="text-sm text-white/40">
                  {hoveredKeyData.avgLatencyMs}ms avg latency
                </div>
              </div>
            ) : hoveredKeyData ? (
              <div className="text-sm text-white/40">
                Not enough data ({hoveredKeyData.totalPresses} / {minPresses} presses)
              </div>
            ) : (
              <div className="text-sm text-white/40">
                No data yet
              </div>
            )}
          </div>
        )}

        {/* Summary stats */}
        {significantKeys.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/[0.08]">
            <div className="text-center">
              <div className="text-sm text-white/40">Weakest key</div>
              <div className="font-mono text-lg font-bold text-white/50">
                {(() => {
                  const weakest = significantKeys.reduce((prev, curr) => {
                    const prevAcc = prev.correctPresses / prev.totalPresses;
                    const currAcc = curr.correctPresses / curr.totalPresses;
                    return currAcc < prevAcc ? curr : prev;
                  });
                  return KEY_LABELS[weakest.key] || weakest.key.toUpperCase();
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/40">Keys tracked</div>
              <div className="font-mono text-lg font-bold text-white">
                {significantKeys.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/40">Slowest key</div>
              <div className="font-mono text-lg font-bold text-white/50">
                {(() => {
                  const slowest = significantKeys.reduce((prev, curr) =>
                    curr.avgLatencyMs > prev.avgLatencyMs ? curr : prev
                  );
                  return KEY_LABELS[slowest.key] || slowest.key.toUpperCase();
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
