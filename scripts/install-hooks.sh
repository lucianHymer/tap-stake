#!/bin/sh
# Install git hooks from scripts/hooks to .git/hooks

HOOKS_DIR="scripts/hooks"
GIT_HOOKS_DIR=".git/hooks"

echo "📦 Installing git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository root"
    exit 1
fi

# Copy all hooks from scripts/hooks to .git/hooks
for hook in "$HOOKS_DIR"/*; do
    if [ -f "$hook" ]; then
        hook_name=$(basename "$hook")
        cp "$hook" "$GIT_HOOKS_DIR/$hook_name"
        chmod +x "$GIT_HOOKS_DIR/$hook_name"
        echo "✅ Installed $hook_name"
    fi
done

echo "🎉 Git hooks installed successfully!"