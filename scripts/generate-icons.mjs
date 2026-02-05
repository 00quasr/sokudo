#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = join(rootDir, 'public', 'icons', 'icon.svg');
const iconsDir = join(rootDir, 'public', 'icons');

const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Generate standard icons
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  // Generate maskable icons (with padding for safe area)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const padding = Math.floor(size * 0.1); // 10% padding for maskable
    const innerSize = size - (padding * 2);

    await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 10, g: 10, b: 11, alpha: 1 } // #0a0a0b
      })
      .png()
      .toFile(join(iconsDir, `icon-maskable-${size}x${size}.png`));
    console.log(`✓ Generated icon-maskable-${size}x${size}.png`);
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
