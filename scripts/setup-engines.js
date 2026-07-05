const fs = require('fs');
const path = require('path');

const ENGINES_DIR = path.join(__dirname, '../apps/web/public/engines/stockfish-17');

function joinParts(baseName, partCount) {
  const targetFile = path.join(ENGINES_DIR, `${baseName}.wasm`);
  
  if (fs.existsSync(targetFile)) {
    console.log(`[Engine Setup] ${baseName}.wasm already assembled.`);
    return;
  }

  console.log(`[Engine Setup] Assembling ${baseName}.wasm from ${partCount} parts...`);
  
  try {
    const buffers = [];
    for (let i = 0; i < partCount; i++) {
      const partPath = path.join(ENGINES_DIR, `${baseName}-part-${i}.wasm`);
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

if (fs.existsSync(ENGINES_DIR)) {
  joinParts('stockfish-17', 6);
  joinParts('stockfish-17-single', 6);
} else {
  console.log(`[Engine Setup] Engines directory not found at ${ENGINES_DIR}`);
}
