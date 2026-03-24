#!/usr/bin/env node

/**
 * Generate app icons from SVG source
 * Run with: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, '..');
const sourceIconPath = resolve(frontendRoot, 'public/running-shoes_5358147.png');
const publicDir = resolve(frontendRoot, 'public');

const sizes = [
  { name: 'app-icon-192.png', size: 192 },
  { name: 'app-icon-512.png', size: 512 },
  { name: 'app-icon-maskable-192.png', size: 192 },
  { name: 'app-icon-maskable-512.png', size: 512 },
];
const iconScale = 0.78;

async function generateIcons() {
  try {
    const sourceIconBuffer = readFileSync(sourceIconPath);
    
    for (const { name, size } of sizes) {
      const outputPath = resolve(publicDir, name);
      const innerSize = Math.round(size * iconScale);
      const resizedIconBuffer = await sharp(sourceIconBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
      })
        .composite([{ input: resizedIconBuffer, gravity: 'center' }])
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }
    
    console.log('\n✨ App icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
