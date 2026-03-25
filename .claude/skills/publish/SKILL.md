---
name: publish
description: Publish content changes by running the publish script, which auto-generates a commit message from changed posts and pushes to master.
disable-model-invocation: true
---

Run `./publish.sh` to publish content changes. This script:
1. Detects changes in `src/content/` and `src/data/`
2. Auto-generates a commit message listing new and updated posts
3. Commits and pushes to master

Before running, verify there are actual content changes to publish with `git status`.
