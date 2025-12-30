#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hookPath = path.join(__dirname, '../.git/hooks/pre-commit');
const hookContent = `#!/bin/sh

echo "Updating documentation..."
node scripts/update-docs.js
git add docs/*.md README.md PROJECT_SUMMARY.md
echo "Documentation updated and staged"
`;

try {
  if (!fs.existsSync(path.dirname(hookPath))) {
    console.log('Git hooks directory not found. Skipping hook setup.');
    process.exit(0);
  }
  
  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log('✓ Git pre-commit hook installed');
} catch (error) {
  console.log('Note: Could not install Git hook (this is optional)');
}
