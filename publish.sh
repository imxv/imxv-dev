#!/bin/bash
# 一键发布博客：commit + push
cd "$(dirname "$0")"

if [ -z "$(git status --porcelain src/content/ src/data/)" ]; then
  echo "没有需要发布的变更。"
  exit 0
fi

# 显示变更
echo "📝 待发布的变更："
git diff --stat src/content/ src/data/
git ls-files --others --exclude-standard src/content/ src/data/
echo ""

# 生成 commit message
NEW_POSTS=$(git ls-files --others --exclude-standard src/content/posts/ | xargs -I{} basename {} .md | xargs -I{} basename {} .mdx)
MODIFIED=$(git diff --name-only src/content/posts/ | xargs -I{} basename {} .md | xargs -I{} basename {} .mdx)

MSG="publish:"
[ -n "$NEW_POSTS" ] && MSG="$MSG new($NEW_POSTS)"
[ -n "$MODIFIED" ] && MSG="$MSG update($MODIFIED)"
[ "$MSG" = "publish:" ] && MSG="publish: update content"

git add src/content/ src/data/
git commit -m "$MSG"
git push

echo ""
echo "✅ 发布完成！"
