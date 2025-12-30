# Scripts

Automation scripts for the Outbound Internal Tool.

## Available Scripts

### `update-docs.js`
Automatically updates documentation files based on code changes.

**Usage:**
```bash
npm run docs:update
```

**Updates:**
- API_REFERENCE.md (from src/lib/api.ts)
- README.md (version from package.json)
- PROJECT_SUMMARY.md (version)
- IMPLEMENTATION_PLAN.md (completed pages)
- Timestamps in all docs

### `watch-docs.js`
Watches for file changes and updates docs in real-time.

**Usage:**
```bash
npm run docs:watch
```

**Watches:**
- src/ directory
- package.json
- supabase/migrations/

### `setup-hooks.js`
Installs Git pre-commit hook for automatic doc updates.

**Usage:**
```bash
node scripts/setup-hooks.js
```

**Runs automatically on:**
- npm install
- npm ci

## How It Works

1. **On Code Change** → Detects modified files
2. **Extract Info** → Parses relevant data
3. **Update Docs** → Modifies MD files
4. **Stage Changes** → Adds to Git (if committing)

## Configuration

All scripts use the same config:

```javascript
const CONFIG = {
  srcDir: '../src',
  docsDir: '../docs',
  rootDir: '..',
  packageJson: '../package.json',
};
```

## Workflow Integration

### Development
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Doc watcher
npm run docs:watch
```

### Before Commit
```bash
# Manual update
npm run docs:update

# Review changes
git diff docs/

# Commit (auto-updates via hook)
git commit -m "message"
```

## Troubleshooting

**Hook not working:**
```bash
node scripts/setup-hooks.js
```

**Permission denied:**
```bash
chmod +x scripts/*.js
```

**Watch mode stuck:**
```bash
pkill -f watch-docs
npm run docs:watch
```

## See Also

- [AUTO_UPDATE.md](../docs/AUTO_UPDATE.md) - Complete documentation
- [IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) - Development roadmap
