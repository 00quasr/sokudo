import { z } from 'zod';

export const badgeStyleSchema = z.enum(['flat', 'flat-square']).default('flat');
export type BadgeStyle = z.infer<typeof badgeStyleSchema>;

export const badgeTypeSchema = z.enum([
  'wpm',
  'accuracy',
  'streak',
  'sessions',
  'best-wpm',
]);
export type BadgeType = z.infer<typeof badgeTypeSchema>;

interface BadgeConfig {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
}

const BADGE_CONFIGS: Record<BadgeType, (stats: BadgeStats) => BadgeConfig> = {
  wpm: (stats) => ({
    label: 'sokudo wpm',
    value: `${stats.avgWpm}`,
    labelColor: '#555',
    valueColor: '#f97316',
  }),
  accuracy: (stats) => ({
    label: 'sokudo accuracy',
    value: `${stats.avgAccuracy}%`,
    labelColor: '#555',
    valueColor: '#3b82f6',
  }),
  streak: (stats) => ({
    label: 'sokudo streak',
    value: `${stats.currentStreak} days`,
    labelColor: '#555',
    valueColor: '#a855f7',
  }),
  sessions: (stats) => ({
    label: 'sokudo sessions',
    value: `${stats.totalSessions}`,
    labelColor: '#555',
    valueColor: '#22c55e',
  }),
  'best-wpm': (stats) => ({
    label: 'sokudo best wpm',
    value: `${stats.bestWpm}`,
    labelColor: '#555',
    valueColor: '#ef4444',
  }),
};

export interface BadgeStats {
  avgWpm: number;
  avgAccuracy: number;
  bestWpm: number;
  totalSessions: number;
  currentStreak: number;
}

function measureTextWidth(text: string, fontSize: number): number {
  // Approximate character width for DejaVu Sans / Verdana at given font size
  // These are standard shields.io approximations
  const avgCharWidth = fontSize * 0.6;
  return Math.ceil(text.length * avgCharWidth);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateBadgeSvg(
  type: BadgeType,
  stats: BadgeStats,
  style: BadgeStyle = 'flat'
): string {
  const config = BADGE_CONFIGS[type](stats);
  const fontSize = 11;
  const padding = 10;

  const labelWidth = measureTextWidth(config.label, fontSize) + padding * 2;
  const valueWidth = measureTextWidth(config.value, fontSize) + padding * 2;
  const totalWidth = labelWidth + valueWidth;
  const height = 20;

  const escapedLabel = escapeXml(config.label);
  const escapedValue = escapeXml(config.value);

  const borderRadius = style === 'flat' ? 3 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${escapedLabel}: ${escapedValue}">
  <title>${escapedLabel}: ${escapedValue}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="${borderRadius}" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="${config.labelColor}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${config.valueColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${fontSize}">
    <text aria-hidden="true" x="${labelWidth / 2}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - padding * 2) * 10}">${escapedLabel}</text>
    <text x="${labelWidth / 2}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - padding * 2) * 10}">${escapedLabel}</text>
    <text aria-hidden="true" x="${labelWidth * 10 + (valueWidth * 10) / 2}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - padding * 2) * 10}">${escapedValue}</text>
    <text x="${labelWidth * 10 + (valueWidth * 10) / 2}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - padding * 2) * 10}">${escapedValue}</text>
  </g>
</svg>`;
}
