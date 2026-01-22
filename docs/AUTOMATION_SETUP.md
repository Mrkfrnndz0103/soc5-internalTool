# AUTOMATION_SETUP

Automation is optional but recommended for internal teams.

## Is this needed?

Yes, if you want documentation and change logs to stay current without manual edits.
No, if the project is small or documentation updates are rare.

## Recommended Automation

- Pre-commit docs sync using `scripts/setup-hooks.js`.
- Live updates during development with `npm run docs:watch`.
- CI step that runs `npm run docs:update`.

## Manual Alternative

- Update docs by hand and include them in code reviews.

Last Updated: 2026-01-22
