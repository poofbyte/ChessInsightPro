const fs = require('fs');
const path = require('path');

const ENGINES_BASE = path.join(__dirname, '../apps/web/public/engines');

function joinParts(engineDir, baseName, partCount) {
  const targetFile = path.join(engineDir, `${baseName}.wasm`);
  
  if (fs.existsSync(targetFile)) {
    console.log(`[Engine Setup] ${baseName}.wasm already assembled.`);
    return;
  }

  console.log(`[Engine Setup] Assembling ${baseName}.wasm from ${partCount} parts...`);
  
  try {
    const buffers = [];
    for (let i = 0; i < partCount; i++) {
      const partPath = path.join(engineDir, `${baseName}-part-${i}.wasm`);
      if (!fs.existsSync(partPath)) {
        throw new Error(`Missing part file: ${partPath}`);
      }
      buffers.push(fs.readFileSync(partPath));
    }
    
    fs.writeFileSync(targetFile, Buffer.concat(buffers));
    console.log(`[Engine Setup] Successfully assembled ${baseName}.wasm`);
  } catch (error) {
    console.error(`[Engine Setup] Error assembling ${baseName}.wasm:`, error.message);
  }
}

const sf17Dir = path.join(ENGINES_BASE, 'stockfish-17');
if (fs.existsSync(sf17Dir)) {
  joinParts(sf17Dir, 'stockfish-17', 6);
  joinParts(sf17Dir, 'stockfish-17-single', 6);
}

const sf18Dir = path.join(ENGINES_BASE, 'stockfish-18');
if (fs.existsSync(sf18Dir)) {
  joinParts(sf18Dir, 'stockfish-18', 10);
  joinParts(sf18Dir, 'stockfish-18-single', 10);
}
