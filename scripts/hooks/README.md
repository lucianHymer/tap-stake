# Git Hooks

Shared git hooks for this project.

## Setup

Run this command after cloning the repo:

```bash
npm run install-hooks
```

This will copy the hooks from `scripts/hooks/` to `.git/hooks/`.

## Available Hooks

- **pre-commit**: Runs the build before allowing commits to ensure no build errors get committed