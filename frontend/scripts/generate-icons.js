#!/usr/bin/env node

/**
 * Generate app icons from SVG source
 * Run with: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const svgPath = resolve('./public/app-icon.svg');
const publicDir = resolve('./public');

const sizes = [
  { name: 'app-icon-192.png', size: 192 },
  { name: 'app-icon-512.png', size: 512 },
  { name: 'app-icon-maskable-192.png', size: 192 },
  { name: 'app-icon-maskable-512.png', size: 512 },
];

async function generateIcons() {
  try {
    const svgBuffer = readFileSync(svgPath);
    
    for (const { name, size } of sizes) {
      const outputPath = resolve(publicDir, name);
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 217, b: 163, alpha: 1 },
        })
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
