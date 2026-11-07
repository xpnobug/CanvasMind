#!/usr/bin/env bash
# 本地提交：绕过 Cursor 自动注入 Co-authored-by；需先 git add 暂存改动
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: scripts/git-commit-local.sh \"<标题>\" [\"<正文>\"]" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/install-git-hooks.sh" >/dev/null

SUBJECT=$1
BODY=${2:-}
MSG_FILE="$(mktemp)"
{
  printf '%s\n' "$SUBJECT"
  if [ -n "$BODY" ]; then
    printf '\n%s\n' "$BODY"
  fi
} > "$MSG_FILE"

TREE="$(git write-tree)"
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  NEW="$(git commit-tree "$TREE" -p HEAD -F "$MSG_FILE")"
else
  NEW="$(git commit-tree "$TREE" -F "$MSG_FILE")"
fi

BRANCH="$(git branch --show-current)"
git update-ref "refs/heads/$BRANCH" "$NEW"
rm -f "$MSG_FILE"

echo "[git-commit-local] $SUBJECT"
git log -1 --format=full
