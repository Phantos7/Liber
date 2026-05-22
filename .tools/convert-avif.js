#!/usr/bin/env node
const sharp = require('./node_modules/sharp');
const fs = require('fs');
const path = require('path');

const targets = [
  { name: 'forest-bg',       quality: 70 },  // krajobraz, niska potrzeba detali
  { name: 'cover-paperback', quality: 78 },  // okładka z tekstem
  { name: 'cover-ebook',     quality: 78 },
  { name: 'cover-audio',     quality: 78 },
  { name: 'publisher-logo',  quality: 85 },  // logo - wymagana ostrość
];

const srcDir = process.argv[2];
const outDir = process.argv[3];

(async () => {
  for (const t of targets) {
    const src = path.join(srcDir, `${t.name}.png`);
    const out = path.join(outDir, `${t.name}.avif`);
    if (!fs.existsSync(src)) {
      console.log(`  ⏭  ${t.name}: brak ${src}`);
      continue;
    }
    const meta = await sharp(src).metadata();
    await sharp(src)
      .avif({ quality: t.quality, effort: 6, chromaSubsampling: '4:2:0' })
      .toFile(out);
    const orig = fs.statSync(src).size;
    const avif = fs.statSync(out).size;
    console.log(`  ${t.name.padEnd(20)} ${meta.hasAlpha ? '🪟' : '  '} q=${t.quality}  PNG ${(orig/1024).toFixed(0).padStart(4)}KB → AVIF ${(avif/1024).toFixed(0).padStart(3)}KB (-${Math.round(100-avif*100/orig)}%)`);
  }
})();
