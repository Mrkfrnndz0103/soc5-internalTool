#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  docsDir: path.join(__dirname, '../docs'),
  rootDir: path.join(__dirname, '..'),
  packageJson: path.join(__dirname, '../package.json'),
};

function updateAPIReference() {
  const apiPath = path.join(CONFIG.srcDir, 'lib/api.ts');
  const docPath = path.join(CONFIG.docsDir, 'API_REFERENCE.md');
  
  if (!fs.existsSync(apiPath)) return;
  
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  let docContent = fs.readFileSync(docPath, 'utf8');
  
  const timestamp = new Date().toISOString().split('T')[0];
  docContent = docContent.replace(/Last Updated: .*/, `Last Updated: ${timestamp}`);
  
  fs.writeFileSync(docPath, docContent);
  console.log('✓ Updated API_REFERENCE.md');
}

function updatePackageInfo() {
  const pkg = JSON.parse(fs.readFileSync(CONFIG.packageJson, 'utf8'));
  
  const readmePath = path.join(CONFIG.rootDir, 'README.md');
  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = readme.replace(/Current Version: \*\*.*\*\*/, `Current Version: **${pkg.version}**`);
  fs.writeFileSync(readmePath, readme);
  
  const summaryPath = path.join(CONFIG.rootDir, 'PROJECT_SUMMARY.md');
  if (fs.existsSync(summaryPath)) {
    let summary = fs.readFileSync(summaryPath, 'utf8');
    summary = summary.replace(/- \*\*Version\*\*: .*/, `- **Version**: ${pkg.version}`);
    fs.writeFileSync(summaryPath, summary);
  }
  
  console.log('✓ Updated version info');
}

function updateImplementationStatus() {
  const pagesDir = path.join(CONFIG.srcDir, 'pages');
  const planPath = path.join(CONFIG.docsDir, 'IMPLEMENTATION_PLAN.md');
  
  if (!fs.existsSync(pagesDir) || !fs.existsSync(planPath)) return;
  
  const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
  let plan = fs.readFileSync(planPath, 'utf8');
  
  pages.forEach(page => {
    const pageName = page.replace('.tsx', '');
    plan = plan.replace(new RegExp(`- \\[ \\] ${pageName}`, 'gi'), match => match.replace('[ ]', '[x]'));
  });
  
  fs.writeFileSync(planPath, plan);
  console.log('✓ Updated IMPLEMENTATION_PLAN.md');
}

function updateTimestamps() {
  const timestamp = new Date().toISOString().split('T')[0];
  const docs = ['README.md', 'PROJECT_SUMMARY.md', 'docs/INDEX.md'];
  
  docs.forEach(doc => {
    const docPath = path.join(CONFIG.rootDir, doc);
    if (!fs.existsSync(docPath)) return;
    
    let content = fs.readFileSync(docPath, 'utf8');
    content = content.replace(/\*\*Last Updated\*\*: .*/, `**Last Updated**: ${timestamp}`);
    fs.writeFileSync(docPath, content);
  });
  
  console.log('✓ Updated timestamps');
}

function main() {
  console.log('🔄 Updating documentation...\n');
  
  try {
    updateAPIReference();
    updatePackageInfo();
    updateImplementationStatus();
    updateTimestamps();
    console.log('\n✅ Documentation updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

export { main };
