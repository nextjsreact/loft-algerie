// Script pour générer les icônes PNG à partir du SVG
// Nécessite sharp: npm install sharp

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <circle cx="256" cy="256" r="240" fill="url(#grad1)"/>
  
  <rect x="180" y="180" width="152" height="120" fill="white" rx="8"/>
  <rect x="200" y="200" width="30" height="30" fill="#4F46E5" rx="4"/>
  <rect x="250" y="200" width="30" height="30" fill="#4F46E5" rx="4"/>
  <rect x="200" y="250" width="30" height="30" fill="#4F46E5" rx="4"/>
  <rect x="250" y="250" width="30" height="30" fill="#4F46E5" rx="4"/>
  
  <polygon points="160,180 256,120 352,180" fill="white"/>
  
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">LA</text>
</svg>
`;

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' }
];

async function generateIcons() {
  const publicDir = path.join(path.dirname(__dirname), 'public');
  
  for (const { size, name } of sizes) {
    try {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`✅ Généré: ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Erreur pour ${name}:`, error.message);
    }
  }
  
  console.log('🎉 Toutes les icônes ont été générées !');
}

generateIcons();