# Documentation Auto-Update System - Setup Complete ✅

## What Was Created

### Scripts (in `scripts/` folder)
1. **update-docs.js** - Main updater that syncs code changes to docs
2. **watch-docs.js** - File watcher for real-time updates during development
3. **setup-hooks.js** - Installs Git pre-commit hook automatically
4. **README.md** - Scripts documentation

### Documentation
1. **docs/AUTO_UPDATE.md** - Complete guide for the auto-update system

### Git Hook
- **pre-commit** - Automatically updates docs on every commit

### Package.json Scripts
```json
{
  "docs:update": "node scripts/update-docs.js",
  "docs:watch": "node scripts/watch-docs.js",
  "postinstall": "node scripts/setup-hooks.js"
}
```

## How It Works

### Automatic Updates

**When you change:**
- `src/lib/api.ts` → Updates `API_REFERENCE.md`
- `package.json` version → Updates `README.md` and `PROJECT_SUMMARY.md`
- `src/pages/*.tsx` → Updates `IMPLEMENTATION_PLAN.md`
- Any file → Updates timestamps

### Three Ways to Update

#### 1. Automatic (Git Commit)
```bash
git add .
git commit -m "your message"
# Docs update automatically via pre-commit hook
```

#### 2. Watch Mode (Development)
```bash
npm run docs:watch
# Watches files and updates docs in real-time
```

#### 3. Manual
```bash
npm run docs:update
# Updates all docs immediately
```

## Usage Examples

### During Development
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch docs
npm run docs:watch

# Make code changes → Docs update automatically
```

### Before Committing
```bash
# Option 1: Let pre-commit hook handle it
git commit -m "Add new feature"

# Option 2: Update manually first
npm run docs:update
git add .
git commit -m "Add new feature"
```

### After Pulling Changes
```bash
git pull
npm install  # Reinstalls hook if needed
npm run docs:update  # Sync docs
```

## What Gets Updated

| Code Change | Documentation Updated |
|-------------|----------------------|
| Add API function in `api.ts` | `API_REFERENCE.md` |
| Change version in `package.json` | `README.md`, `PROJECT_SUMMARY.md` |
| Create new page in `src/pages/` | `IMPLEMENTATION_PLAN.md` |
| Any code change | All timestamps |

## Testing

Test the system:

```bash
# 1. Test manual update
npm run docs:update

# 2. Test watch mode
npm run docs:watch
# Make a change to src/lib/api.ts
# Check if docs update

# 3. Test git hook
echo "// test" >> src/lib/api.ts
git add .
git commit -m "test"
# Check if docs were updated
```

## Benefits

✅ **Always Up-to-Date** - Docs sync with code automatically
✅ **No Manual Work** - Forget about updating docs manually
✅ **Consistent** - Same format and structure always
✅ **Version Tracking** - Automatic version updates
✅ **Timestamps** - Always know when docs were last updated
✅ **Zero Overhead** - Runs in background, no slowdown

## Configuration

All settings in `scripts/update-docs.js`:

```javascript
const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  docsDir: path.join(__dirname, '../docs'),
  rootDir: path.join(__dirname, '..'),
  packageJson: path.join(__dirname, '../package.json'),
};
```

## Troubleshooting

### Hook Not Running
```bash
node scripts/setup-hooks.js
```

### Permission Issues (Unix/Mac)
```bash
chmod +x scripts/*.js
chmod +x .git/hooks/pre-commit
```

### Watch Mode Stuck
```bash
# Windows
taskkill /F /IM node.exe /FI "WINDOWTITLE eq watch-docs"

# Unix/Mac
pkill -f watch-docs
```

## Customization

### Add New Update Rule

Edit `scripts/update-docs.js`:

```javascript
function updateMyNewDoc() {
  const myFile = path.join(CONFIG.srcDir, 'my-file.ts');
  const docPath = path.join(CONFIG.docsDir, 'MY_DOC.md');
  
  // Your update logic here
  
  console.log('✓ Updated MY_DOC.md');
}

// Add to main()
function main() {
  // ... existing updates
  updateMyNewDoc();
}
```

### Disable for Specific Commit
```bash
git commit --no-verify -m "Skip doc update"
```

### Disable Permanently
```bash
rm .git/hooks/pre-commit
```

## Next Steps

1. ✅ System is installed and ready
2. ✅ Test with `npm run docs:update`
3. ✅ Use `npm run docs:watch` during development
4. ✅ Commit code - docs update automatically

## Documentation

- **Full Guide**: [docs/AUTO_UPDATE.md](docs/AUTO_UPDATE.md)
- **Scripts Info**: [scripts/README.md](scripts/README.md)
- **Main README**: [README.md](README.md)

## Support

Issues with auto-update:
1. Check Node.js version (requires 14+)
2. Run `npm run docs:update` manually
3. Check error messages
4. Review [docs/AUTO_UPDATE.md](docs/AUTO_UPDATE.md)

---

**Status**: ✅ Fully Operational
**Last Updated**: 2024-01
**Maintained by**: SOC5 Development Team
