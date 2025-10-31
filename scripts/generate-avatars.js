// Node script: run from repo root (node scripts/generate-avatars.js)
// It reads files from public/avatars and writes public/avatars/avatars.json
// Put your avatar images into public/avatars first.

const fs = require('fs');
const path = require('path');

const avatarDir = path.join(__dirname, '..', 'public', 'avatars');
const outFile = path.join(avatarDir, 'avatars.json');

if (!fs.existsSync(avatarDir)) {
  console.error('Avatar directory not found:', avatarDir);
  process.exit(1);
}

const allowed = /\.(png|jpe?g|gif|webp|svg)$/i;
const files = fs.readdirSync(avatarDir).filter(f => allowed.test(f) && f !== 'avatars.json');

if (files.length === 0) {
  console.log('No avatar image files found in', avatarDir);
}

fs.writeFileSync(outFile, JSON.stringify(files, null, 2));
console.log('Wrote avatars.json with', files.length, 'entries to', outFile);
