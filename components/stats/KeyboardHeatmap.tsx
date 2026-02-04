'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  if (accuracy >= 98) return 'bg-green-500';
  if (accuracy >= 95) return 'bg-green-400';
  if (accuracy >= 90) return 'bg-yellow-400';
  if (accuracy >= 85) return 'bg-orange-400';
  if (accuracy >= 80) return 'bg-orange-500';
  return 'bg-red-500';
}

function getAccuracyTextColor(accuracy: number): string {
  if (accuracy >= 98) return 'text-green-500';
  if (accuracy >= 95) return 'text-green-400';
  if (accuracy >= 90) return 'text-yellow-400';
  if (accuracy >= 85) return 'text-orange-400';
  if (accuracy >= 80) return 'text-orange-500';
  return 'text-red-500';
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Keyboard Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                        border border-gray-700
                        cursor-pointer
                        transition-all duration-150
                        ${hasAccuracy ? getAccuracyColor(accuracy) : 'bg-gray-800'}
                        ${hasAccuracy ? 'text-white' : 'text-gray-500'}
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
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-muted-foreground">&lt;80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-muted-foreground">80-85%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-400" />
              <span className="text-muted-foreground">85-90%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-muted-foreground">90-95%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400" />
              <span className="text-muted-foreground">95-98%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-muted-foreground">&ge;98%</span>
            </div>
          </div>

          {/* Tooltip / Detail panel */}
          {hoveredKey && (
            <div className="text-center p-3 bg-gray-900 rounded-lg">
              <div className="font-mono text-lg font-bold mb-1">
                {KEY_LABELS[hoveredKey] || hoveredKey.toUpperCase()}
              </div>
              {hoveredKeyData && hoveredKeyData.totalPresses >= minPresses ? (
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${getAccuracyTextColor(hoveredAccuracy!)}`}>
                    {hoveredAccuracy}% accuracy
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hoveredKeyData.correctPresses} / {hoveredKeyData.totalPresses} correct
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hoveredKeyData.avgLatencyMs}ms avg latency
                  </div>
                </div>
              ) : hoveredKeyData ? (
                <div className="text-sm text-muted-foreground">
                  Not enough data ({hoveredKeyData.totalPresses} / {minPresses} presses)
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          )}

          {/* Summary stats */}
          {significantKeys.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-800">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Weakest Key</div>
                <div className="font-mono text-lg font-bold text-red-400">
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
                <div className="text-sm text-muted-foreground">Keys Tracked</div>
                <div className="font-mono text-lg font-bold">
                  {significantKeys.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Slowest Key</div>
                <div className="font-mono text-lg font-bold text-orange-400">
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
      </CardContent>
    </Card>
  );
}
