#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { main as updateDocs } from './update-docs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WATCH_PATHS = [
  path.join(__dirname, '../src'),
  path.join(__dirname, '../package.json'),
  path.join(__dirname, '../supabase/migrations'),
];

console.log('👀 Watching for file changes...\n');

WATCH_PATHS.forEach(watchPath => {
  if (!fs.existsSync(watchPath)) return;
  
  const isFile = fs.statSync(watchPath).isFile();
  
  if (isFile) {
    fs.watch(watchPath, (eventType) => {
      if (eventType === 'change') {
        console.log(`\n📝 ${path.basename(watchPath)} changed`);
        updateDocs();
      }
    });
  } else {
    fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
      if (eventType === 'change' && filename) {
        console.log(`\n📝 ${filename} changed`);
        updateDocs();
      }
    });
  }
});

console.log('Watching:');
WATCH_PATHS.forEach(p => console.log(`  - ${p}`));
console.log('\nPress Ctrl+C to stop\n');
