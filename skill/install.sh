#!/usr/bin/env bash
set -euo pipefail

# mDrop Agent Skill Installer
# Install: curl -fsSL https://raw.githubusercontent.com/vincenthopf/mdrop/main/skill/install.sh | bash

REPO="https://github.com/vincenthopf/mdrop.git"
SKILL_NAME="mdrop"

# Detect OS
case "$(uname -s)" in
    Darwin*)  OS="macos" ;;
    Linux*)   OS="linux" ;;
    MINGW*|MSYS*|CYGWIN*)  OS="windows" ;;
    *)        echo "Unsupported OS: $(uname -s)"; exit 1 ;;
esac

# Set paths
CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
AGENTS_DIR="$HOME/.agents"
SKILL_REPO_DIR="$AGENTS_DIR/$SKILL_NAME"

echo ""
echo "  mDrop Agent Skill Installer"
echo "  ─────────────────────────────"
echo ""

# Check for git
if ! command -v git &>/dev/null; then
    echo "  ✗ git is required but not installed."
    exit 1
fi

# Create directories
mkdir -p "$SKILLS_DIR" "$AGENTS_DIR"

# Clone or update the repo
if [ -d "$SKILL_REPO_DIR" ]; then
    echo "  → Updating existing installation..."
    git -C "$SKILL_REPO_DIR" pull --quiet
else
    echo "  → Cloning mDrop..."
    git clone --quiet --depth 1 "$REPO" "$SKILL_REPO_DIR"
fi

# Create symlink to Claude skills directory
SKILL_SOURCE="$SKILL_REPO_DIR/skill/$SKILL_NAME.md"
SKILL_LINK="$SKILLS_DIR/$SKILL_NAME.md"

if [ -L "$SKILL_LINK" ]; then
    rm "$SKILL_LINK"
fi

if [ "$OS" = "windows" ]; then
    # Windows: use mklink (requires elevated permissions or developer mode)
    SKILL_SOURCE_WIN=$(cygpath -w "$SKILL_SOURCE" 2>/dev/null || echo "$SKILL_SOURCE")
    SKILL_LINK_WIN=$(cygpath -w "$SKILL_LINK" 2>/dev/null || echo "$SKILL_LINK")
    cmd //c "mklink \"$SKILL_LINK_WIN\" \"$SKILL_SOURCE_WIN\"" &>/dev/null || {
        # Fallback: copy instead of symlink
        cp "$SKILL_SOURCE" "$SKILL_LINK"
        echo "  ⚠ Could not create symlink (Windows). Copied skill file instead."
    }
else
    ln -sf "$SKILL_SOURCE" "$SKILL_LINK"
fi

echo ""
echo "  ✓ Skill installed at $SKILL_LINK"
echo "  ✓ Repo cloned to $SKILL_REPO_DIR"
echo ""
echo "  Usage in Claude Code:"
echo "    /mdrop              — set up or share a file"
echo "    \"share this file\"   — share the current file"
echo ""
