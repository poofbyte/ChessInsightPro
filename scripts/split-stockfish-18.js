const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../node_modules/stockfish/bin');
const DEST_DIR = path.join(__dirname, '../apps/web/public/engines/stockfish-18');

function splitFile(baseName, partCount) {
  const srcPath = path.join(SRC_DIR, `${baseName}.wasm`);
  if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcPath}`);
    return;
  }

  console.log(`Splitting ${baseName}.wasm into ${partCount} parts...`);
  const buffer = fs.readFileSync(srcPath);
  const partSize = Math.ceil(buffer.length / partCount);

  for (let i = 0; i < partCount; i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, buffer.length);
    const chunk = buffer.subarray(start, end);
    const destPath = path.join(DEST_DIR, `${baseName}-part-${i}.wasm`);
    fs.writeFileSync(destPath, chunk);
  }
  console.log(`Successfully split ${baseName}.wasm`);
}

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

splitFile('stockfish-18', 10);
splitFile('stockfish-18-single', 10);
