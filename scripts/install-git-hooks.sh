#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT/.git/hooks"
SRC="$ROOT/scripts/git-hooks/commit-msg"

mkdir -p "$HOOKS_DIR"
cp "$SRC" "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"
echo "[install-git-hooks] 已安装 commit-msg hook（过滤 AI Co-authored-by）"
