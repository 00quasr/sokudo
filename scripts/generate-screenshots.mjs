#!/usr/bin/env node
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'public', 'screenshots');

async function generateScreenshots() {
  console.log('Generating placeholder screenshots...');

  // Desktop screenshot (1280x720)
  const desktopSvg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#0a0a0b"/>
      <text x="640" y="340" font-family="monospace" font-size="32" fill="#10b981" text-anchor="middle">Sokudo - Developer Typing Trainer</text>
      <text x="640" y="390" font-family="monospace" font-size="20" fill="#a1a1aa" text-anchor="middle">Practice git commands at speed</text>
    </svg>
  `;

  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(join(screenshotsDir, 'desktop-1.png'));
  console.log('✓ Generated desktop-1.png (1280x720)');

  // Mobile screenshot (750x1334)
  const mobileSvg = `
    <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
      <rect width="750" height="1334" fill="#0a0a0b"/>
      <text x="375" y="640" font-family="monospace" font-size="28" fill="#10b981" text-anchor="middle">Sokudo</text>
      <text x="375" y="690" font-family="monospace" font-size="18" fill="#a1a1aa" text-anchor="middle">Mobile typing practice</text>
    </svg>
  `;

  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(join(screenshotsDir, 'mobile-1.png'));
  console.log('✓ Generated mobile-1.png (750x1334)');

  console.log('\n✅ All screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
