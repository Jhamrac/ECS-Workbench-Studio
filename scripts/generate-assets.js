import fs from 'fs';
import path from 'path';

// Pure Node.js 24-bit BMP generator
function createBMP(width, height, getPixelRGB) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BMP File Header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  // BITMAPINFOHEADER
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y++) {
    const imageY = height - 1 - y; // top-down to bottom-up
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixelRGB(x, imageY);
      const pxOffset = rowOffset + x * 3;
      buf[pxOffset] = Math.min(255, Math.max(0, Math.round(b)));
      buf[pxOffset + 1] = Math.min(255, Math.max(0, Math.round(g)));
      buf[pxOffset + 2] = Math.min(255, Math.max(0, Math.round(r)));
    }
  }

  return buf;
}

// Minimal 256x256 / 48x48 / 32x32 / 16x16 ICO Generator
function createICO(pngOrBmpBuffers) {
  // Simple ICO with single/multiple BMP icons
  let totalHeaderSize = 6 + pngOrBmpBuffers.length * 16;
  let currentDataOffset = totalHeaderSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(pngOrBmpBuffers.length, 4); // Count

  const entryBuffers = [];
  const dataBuffers = [];

  for (const item of pngOrBmpBuffers) {
    const { width, height, buf } = item;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(24, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Size
    entry.writeUInt32LE(currentDataOffset, 12); // Offset

    entryBuffers.push(entry);
    dataBuffers.push(buf);
    currentDataOffset += buf.length;
  }

  return Buffer.concat([header, ...entryBuffers, ...dataBuffers]);
}

// -------------------------------------------------------------
// Generate Sidebar BMP (164 x 314 px) - NSIS Installer Left Panel
// -------------------------------------------------------------
console.log('Generating NSIS installer sidebar BMP (164x314)...');
const sidebarBMP = createBMP(164, 314, (x, y) => {
  // Deep ECS Blue background gradient with high-tech dark overlay
  const t = y / 314;
  
  // ECS Blue `#0A529C` (10, 82, 156) to Dark Blue `#061D3A` (6, 29, 58)
  let r = 10 * (1 - t) + 6 * t;
  let g = 82 * (1 - t) + 29 * t;
  let b = 156 * (1 - t) + 58 * t;

  // Wave accent: y = 200 + sin(x/25) * 12
  const waveY = 190 + Math.sin(x / 20) * 8;
  const distToWave = Math.abs(y - waveY);
  
  if (distToWave < 3) {
    // ECS Green Wave `#39A935` (57, 169, 53)
    r = 57;
    g = 169;
    b = 53;
  } else if (y > waveY && y < waveY + 20) {
    // Subtle green glow under wave
    const alpha = 1 - (y - waveY) / 20;
    r = r * (1 - alpha) + 35 * alpha;
    g = g * (1 - alpha) + 140 * alpha;
    b = b * (1 - alpha) + 40 * alpha;
  }

  // Draw ECS Circle Logo at Top (Center X=82, Center Y=80, Radius=45)
  const dx = x - 82;
  const dy = y - 80;
  const distSq = dx * dx + dy * dy;
  if (distSq <= 45 * 45) {
    // Inside ECS Circle Logo
    const cWaveY = 80 + Math.sin(dx / 12) * 5;
    if (Math.abs(y - cWaveY) < 2) {
      // Circle inner green wave
      r = 57; g = 169; b = 53;
    } else {
      // Circle ECS Blue `#0A529C`
      r = 10; g = 82; b = 156;
      
      // White inner ring accent
      if (Math.abs(Math.sqrt(distSq) - 44) < 1.5) {
        r = 255; g = 255; b = 255;
      }
    }
  }

  // Decorative border line on right side
  if (x === 163) {
    r = 57; g = 169; b = 53; // ECS Green border line
  }

  return [r, g, b];
});

// -------------------------------------------------------------
// Generate Header BMP (150 x 57 px) - NSIS Installer Top Right Banner
// -------------------------------------------------------------
console.log('Generating NSIS installer header BMP (150x57)...');
const headerBMP = createBMP(150, 57, (x, y) => {
  // Gradient from Deep Blue `#0A529C` to Navy `#082C54`
  const t = x / 150;
  let r = 10 * (1 - t) + 8 * t;
  let g = 82 * (1 - t) + 44 * t;
  let b = 156 * (1 - t) + 84 * t;

  // Wave accent across bottom
  const waveY = 48 + Math.sin(x / 15) * 4;
  if (Math.abs(y - waveY) < 2) {
    r = 57; g = 169; b = 53; // ECS Green
  }

  // Mini ECS Badge on right (Center X=125, Y=26, Radius=18)
  const dx = x - 125;
  const dy = y - 26;
  if (dx * dx + dy * dy <= 18 * 18) {
    r = 10; g = 82; b = 156;
    if (Math.abs(Math.sqrt(dx * dx + dy * dy) - 17) < 1) {
      r = 255; g = 255; b = 255;
    }
  }

  return [r, g, b];
});

// -------------------------------------------------------------
// Generate 48x48 Icon BMP for ICO
// -------------------------------------------------------------
console.log('Generating 48x48 icon BMP...');
const iconBMP48 = createBMP(48, 48, (x, y) => {
  const dx = x - 24;
  const dy = y - 24;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 22) {
    const waveY = 24 + Math.sin(dx / 6) * 3;
    if (Math.abs(y - waveY) < 1.5) {
      return [57, 169, 53]; // ECS Green
    }
    return [10, 82, 156]; // ECS Blue
  }
  return [15, 23, 42]; // Dark background frame
});

// Create directories
if (!fs.existsSync('build')) fs.mkdirSync('build');
if (!fs.existsSync('public')) fs.mkdirSync('public');

// Write BMP files
fs.writeFileSync('build/installerSidebar.bmp', sidebarBMP);
fs.writeFileSync('build/uninstallerSidebar.bmp', sidebarBMP);
fs.writeFileSync('build/installerHeader.bmp', headerBMP);
fs.writeFileSync('build/installerHeaderIcon.bmp', iconBMP48);

// Create ICO files
const icoBuffer = createICO([{ width: 48, height: 48, buf: iconBMP48 }]);
fs.writeFileSync('build/icon.ico', icoBuffer);
fs.writeFileSync('public/favicon.ico', icoBuffer);

console.log('Successfully generated all custom ECS installer assets!');
