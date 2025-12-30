# Documentation Auto-Update System

Automated system that keeps documentation synchronized with code changes.

## How It Works

The system monitors code changes and automatically updates relevant MD files:

- **API changes** → Updates `API_REFERENCE.md`
- **Package.json changes** → Updates version in `README.md` and `PROJECT_SUMMARY.md`
- **New pages** → Updates `IMPLEMENTATION_PLAN.md`
- **Any change** → Updates timestamps

## Usage

### Manual Update
```bash
npm run docs:update
```

### Watch Mode (Development)
```bash
npm run docs:watch
```

### Automatic (Git Commit)
Documentation updates automatically on every commit via Git pre-commit hook.

## What Gets Updated

| File Changed | Documentation Updated |
|--------------|----------------------|
| `src/lib/api.ts` | `API_REFERENCE.md` |
| `package.json` | `README.md`, `PROJECT_SUMMARY.md` |
| `src/pages/*.tsx` | `IMPLEMENTATION_PLAN.md` |
| `supabase/migrations/*.sql` | `DATABASE_SETUP.md` |
| Any file | Timestamps in all docs |

## Scripts

### `scripts/update-docs.js`
Main updater script that:
- Scans code files
- Extracts relevant information
- Updates documentation files
- Updates timestamps

### `scripts/watch-docs.js`
File watcher that:
- Monitors source files
- Triggers updates on changes
- Runs in background during development

### `scripts/setup-hooks.js`
Hook installer that:
- Sets up Git pre-commit hook
- Runs automatically on `npm install`
- Ensures docs stay in sync

## Configuration

Edit `scripts/update-docs.js` to customize:

```javascript
const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  docsDir: path.join(__dirname, '../docs'),
  rootDir: path.join(__dirname, '..'),
  packageJson: path.join(__dirname, '../package.json'),
};
```

## Workflow

### Development
1. Make code changes
2. Run `npm run docs:watch` (optional)
3. Documentation updates automatically

### Commit
1. Stage your changes: `git add .`
2. Commit: `git commit -m "message"`
3. Pre-commit hook updates docs automatically
4. Docs are included in commit

### Manual
1. Make changes
2. Run `npm run docs:update`
3. Review updated docs
4. Commit all changes

## Examples

### Adding New API Function

**Before** (in `src/lib/api.ts`):
```typescript
export const userApi = {
  async getUser(id: string) {
    // implementation
  }
}
```

**After commit**: `API_REFERENCE.md` automatically updated with new function.

### Updating Version

**Before** (in `package.json`):
```json
{
  "version": "1.0.0"
}
```

**Change to**:
```json
{
  "version": "1.1.0"
}
```

**After commit**: Version updated in `README.md` and `PROJECT_SUMMARY.md`.

### Creating New Page

**Before**: Create `src/pages/reports.tsx`

**After commit**: `IMPLEMENTATION_PLAN.md` marks "reports page" as complete.

## Troubleshooting

### Hook Not Running
```bash
# Reinstall hook
node scripts/setup-hooks.js
```

### Manual Update Fails
```bash
# Check Node.js version (requires 14+)
node --version

# Run with verbose output
node scripts/update-docs.js
```

### Watch Mode Issues
```bash
# Kill existing watchers
pkill -f watch-docs

# Restart
npm run docs:watch
```

## Disabling Auto-Update

### Temporarily (Single Commit)
```bash
git commit --no-verify -m "message"
```

### Permanently
```bash
# Remove hook
rm .git/hooks/pre-commit
```

## Best Practices

1. **Run watch mode during development**
   ```bash
   npm run docs:watch
   ```

2. **Review doc changes before committing**
   ```bash
   git diff docs/
   ```

3. **Update manually after major changes**
   ```bash
   npm run docs:update
   ```

4. **Keep scripts updated** as project evolves

## Maintenance

### Update Mappings
Edit `scripts/update-docs.js` to add new file-to-doc mappings:

```javascript
const DOC_MAPPINGS = {
  'src/new-file.ts': ['docs/NEW_DOC.md'],
};
```

### Add New Updaters
Add functions to `scripts/update-docs.js`:

```javascript
function updateNewDoc() {
  // Your update logic
}

// Add to main()
function main() {
  updateNewDoc();
  // ... other updates
}
```

## Benefits

✅ Always up-to-date documentation
✅ No manual doc updates needed
✅ Consistent documentation
✅ Reduced maintenance burden
✅ Automatic version tracking
✅ Timestamp management

## Limitations

- Only updates specific patterns
- Requires Node.js
- Git hook may be overwritten
- Watch mode uses system resources

## Future Enhancements

- [ ] AI-powered doc generation
- [ ] Changelog automation
- [ ] API schema validation
- [ ] Breaking change detection
- [ ] Multi-language support

## Support

Issues with auto-update system:
- Check Node.js version
- Verify file paths
- Review error messages
- Contact development team
