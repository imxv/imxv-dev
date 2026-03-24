---
title: Build in Public Blog：Astro + Obsidian + S3 多端同步方案
description: 完整记录用 Astro 6 搭建静态博客，打通 Obsidian 写作 → S3 同步 → GitHub Action 自动部署的全流程。
date: 2026-03-24
type: article
tags:
  - tooling
  - blog
  - devlog
toc: true
draft: false
---

## 为什么

最近逐渐将笔记从 notion 迁移到obsidian 中了，一直想用 Build in Public 的方式记录自己在 AI Agent 工具链上的探索和学习，于是就有了这个。

核心诉求：

- **写作体验要好**——习惯用 Obsidian 写 Markdown，不想换编辑器
- **多端同步**——不绑定单台设备，任何设备写完都能发布
- **部署要简单**——push 即上线，不想碰服务器
- **零运维成本**——静态站 + CDN，不想操心数据库和后端

最终方案：**Astro 静态博客 + Obsidian 写作 + S3 多端同步 + GitHub Action 自动部署 + Cloudflare Pages 托管**。

## 技术栈选型

| 层面  | 选型                        | 理由                            |
| --- | ------------------------- | ----------------------------- |
| 框架  | Astro 6                   | 内容驱动静态站，零 JS by default，构建快   |
| 内容  | MDX + Content Collections | Markdown 写作，需要交互时嵌入 React 组件  |
| 样式  | Tailwind CSS 4            | 快速迭代设计，CSS-in-CSS 配置          |
| 交互  | React 19 (Islands)        | 仅用于需要交互的组件，按需加载               |
| 部署  | Cloudflare Pages          | git push 自动构建，全球 CDN，free     |
| 写作  | Obsidian                  | 本地 Markdown 编辑器，支持模板和插件生态     |
| 同步  | S3 (CSTCloud)             | Obsidian Remote Save 插件，多设备同步 |
| 自动化 | GitHub Actions            | 定时从 S3 拉取文章，提交到仓库触发部署         |

### 为什么选 Astro 而不是 Next.js / Hugo

- **Next.js**：虽然 next.js写起来更爽 功能强大，但对纯内容blog来说太重了，SSR/ISR 是我不需要的复杂度
- **Hugo**：构建极快但模板语法不够灵活，想嵌入 React 交互组件时很痛苦
- **Astro**：天生为内容站设计，Markdown/MDX 一等公民，需要交互时用 Islands 架构按需加载 React 组件，其余页面零 JS

## 项目搭建

### 初始化

```bash
# Node.js 22+（Astro 6 要求）
nvm install 22 && nvm use 22

# 创建项目
pnpm create astro@latest imxv-dev -- --template minimal --typescript strict

cd imxv-dev

# 添加集成
pnpm astro add mdx react tailwind sitemap --yes
pnpm add @astrojs/rss @tailwindcss/typography
```

Astro 6 中 Tailwind 4 通过 Vite 插件集成（不再需要 `@astrojs/tailwind`），`astro add tailwind` 会自动配好 `@tailwindcss/vite`。

### 核心配置

**astro.config.mjs**：

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://imxv.dev',
  integrations: [mdx(), react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: { theme: 'github-dark-default' },
  },
});
```

### Content Collections

Astro 6 要求 content config 放在 `src/content.config.ts`（注意不是项目根目录）：

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod'; // Astro 6 中 z 从 astro/zod 导入

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    type: z.enum(['article', 'til', 'weekly']),
    tags: z.array(z.string()).default([]),
    toc: z.boolean().default(true),
    draft: z.boolean().default(false),
    weekNumber: z.number().optional(),
  }),
});

export const collections = { posts };
```

我设计了三种内容类型在同一个时间线里混排：

- **article**——完整文章，带目录
- **til** (Today I Learned)——短小的技术发现/学习，一行展示
- **weekly**——周记，带 `W{weekNumber}` 前缀
- ...

### 设计系统

配色用的 Rosé Pine Dawn 色系，在 Tailwind 4 中通过 CSS `@theme` 定义：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-bg: #faf4ed;
  --color-text-primary: #575279;
  --color-accent: #b4637a;
  --color-tag-blue: #286983;
  --color-tag-green: #618774;
  --color-tag-purple: #907aa9;
  --color-tag-orange: #ea9d34;
  /* ... */
}
```

字体组合：Newsreader（标题）+ Source Sans 3（正文）+ DM Mono（代码/标签），通过 Google Fonts 加载。

### 目录结构

```
imxv-dev/
├── astro.config.mjs
├── src/
│   ├── content.config.ts       # Content Collections schema
│   ├── components/             # Astro 组件 + React Islands
│   ├── content/posts/          # 所有文章（.md/.mdx）
│   ├── data/                   # 站点配置、Now 页面、项目数据
│   ├── layouts/                # BaseLayout / PostLayout / PageLayout
│   ├── pages/                  # 路由页面
│   └── styles/global.css       # 设计系统
├── .github/
│   ├── workflows/sync-posts.yml  # S3 同步 Action
│   └── scripts/sync-s3.py       # 同步脚本
└── publish.sh                  # 本地一键发布脚本
```

## Obsidian 联动

### 软链接方案（本地开发）

最简单的方式是把博客的文章目录软链到 Obsidian vault 里：

```bash
ln -s ~/imxv-dev/src/content/posts ~/Documents/Obsidian\ Vault/blog
```

这样在 Obsidian 的 `blog/` 文件夹里写文章，实际上就是在写博客内容。

### 模板配置

在 Obsidian vault 的 `templates/` 文件夹下创建三个博客模板：

**blog-文章.md**：
```yaml
---
title: "{{title}}"
description: ""
date: {{date}}
type: article
tags: []
toc: true
draft: false
---
```

**blog-TIL.md**：
```yaml
---
title: "TIL: {{title}}"
description: ""
date: {{date}}
type: til
tags: []
toc: false
draft: false
---
```

**blog-周记.md**：
```yaml
---
title: "{{title}}"
description: ""
date: {{date}}
type: weekly
tags: [weekly]
weekNumber:
toc: false
draft: false
---
```

设置：Obsidian → 设置 → 核心插件 → 开启「模板」→ 模板文件夹设为 `templates`。

写文章时：在 `blog/` 文件夹新建文件 → `Cmd+T` 选模板 → 填 title / description / tags → 写正文。

### 文件命名规范

文件名就是 URL slug，规则很简单：

- 全小写英文 + 短横线：`claude-code-log-bridge.md`
- 不要中文和空格
- 后缀用 `.md`（需要嵌入 React 组件时用 `.mdx`）

生成的 URL：`imxv.dev/posts/claude-code-log-bridge`

### Frontmatter 即笔记属性

Obsidian 会把 frontmatter 显示为「笔记属性」面板，每个字段的含义：

- **title**——文章标题（页面上显示的，跟文件名无关）
- **description**——一句话摘要，用于 SEO 和列表页
- **date**——发布日期
- **type**——`article` / `til` / `weekly` 三选一
- **tags**——技术标签，用于分类筛选
- **toc**——是否显示右侧目录（长文建议开）
- **draft**——草稿开关，勾选则不会构建发布

## 多端同步方案

后面思考了一下，单机软链接的问题是显而易见的：换一台电脑就没法发布了。我的 Obsidian 笔记是通过 **Remote Save 插件 + S3** 在多设备间同步，所以方案是让 GitHub Action 定时从 S3 拉取文章。（Public Repo 的 action 时长不限，感谢大善人
![](https://iili.io/qrUMnhQ.png)

### 架构

```
任何设备的 Obsidian
    ↓ Remote Save 同步
S3 存储（blog/ 目录）
    ↓ GitHub Action 每 5 分钟检查
GitHub 仓库（src/content/posts/）
    ↓ git push 触发
Cloudflare Pages 自动构建部署
    ↓
imxv.dev 上线
```

### GitHub Action 配置

`.github/workflows/sync-posts.yml`：

```yaml
name: Sync posts from Obsidian S3

on:
  schedule:
    - cron: '*/5 * * * *'  # 每 5 分钟
  workflow_dispatch:         # 支持手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install boto3
      - name: Sync blog posts from S3
        env:
          S3_ENDPOINT: ${{ secrets.S3_ENDPOINT }}
          S3_REGION: ${{ secrets.S3_REGION }}
          S3_ACCESS_KEY: ${{ secrets.S3_ACCESS_KEY }}
          S3_SECRET_KEY: ${{ secrets.S3_SECRET_KEY }}
          S3_BUCKET: ${{ secrets.S3_BUCKET }}
        run: python .github/scripts/sync-s3.py
      - name: Commit and push if changed
        run: |
          git config user.name "blog-bot"
          git config user.email "bot@imxv.dev"
          git add src/content/posts/
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "sync: update posts from obsidian"
            git push
          fi
```

### 同步脚本

`.github/scripts/sync-s3.py`：

```python
import os
import boto3

POSTS_DIR = "src/content/posts"
S3_PREFIX = "blog/"

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["S3_ENDPOINT"],
    region_name=os.environ["S3_REGION"],
    aws_access_key_id=os.environ["S3_ACCESS_KEY"],
    aws_secret_access_key=os.environ["S3_SECRET_KEY"],
)
bucket = os.environ["S3_BUCKET"]

os.makedirs(POSTS_DIR, exist_ok=True)

# 从 S3 下载所有博客文件
s3_files = set()
paginator = s3.get_paginator("list_objects_v2")
for page in paginator.paginate(Bucket=bucket, Prefix=S3_PREFIX):
    for obj in page.get("Contents", []):
        key = obj["Key"]
        rel = key[len(S3_PREFIX):]
        if not rel or not rel.endswith((".md", ".mdx")):
            continue
        s3_files.add(rel)
        local_path = os.path.join(POSTS_DIR, rel)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        s3.download_file(bucket, key, local_path)

# 删除 S3 中已不存在的文件
for fname in os.listdir(POSTS_DIR):
    if fname.endswith((".md", ".mdx")) and fname not in s3_files:
        os.remove(os.path.join(POSTS_DIR, fname))
```

脚本做两件事：下载 S3 中 `blog/` 前缀下的所有 Markdown 文件，删除本地有但 S3 中已删除的文件。

### GitHub Secrets 配置

在仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 值 |
|--------|------|
| `S3_ENDPOINT` | S3 服务的完整 URL |
| `S3_REGION` | Region |
| `S3_ACCESS_KEY` | Access Key ID |
| `S3_SECRET_KEY` | Secret Access Key |
| `S3_BUCKET` | 存储桶名称 |

注意：这里用的是 S3 兼容存储（CSTCloud），不是 AWS S3，所以需要自定义 endpoint。
boto3 的 `endpoint_url` 参数支持任何 S3 兼容服务。

### 关于 GitHub Actions 免费额度

- **Public 仓库**：Actions 运行时间不限
- **Private 仓库**：每月 2000 分钟免费额度，每 5 分钟跑一次约消耗 2880 分钟/月，会超
- Cron 调度不保证精确，有时候会有延迟，~~免费的还要什么自行车~~
- 随时可以在 Actions 页面手动 Run workflow 立即触发

## 部署到 Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git
2. 选择 GitHub 仓库
3. 构建配置：

| 变量                     | 值            |     |
| ---------------------- | ------------ | --- |
| Framework preset       | Astro        |     |
| Build command          | `pnpm build` |     |
| Build output directory | `dist`       |     |
| 环境变量 `NODE_VERSION`    | `22`         |     |

4. Save and Deploy

之后每次 `git push` 到 master 自动构建部署，不需要额外配置 webhook。

## 最终工作流

写文章只需要两步：

1. **任何设备**打开 Obsidian → `blog/` 文件夹 → 新建文件 → 插入模板 → 写内容
2. **触发 Remote Save 同步**

然后自动发生：S3 更新 → GitHub Action 拉取 → 提交到仓库 → Cloudflare 构建 → 网站上线。

整个过程不需要终端、不需要 git 命令、不需要特定电脑。

## 踩过的坑

### Astro 6 的 Content Config 位置

Astro 5 中 content config 在项目根目录 `content.config.ts`，Astro 6 改到了 `src/content.config.ts`。放错位置不会报错，只会提示 "collection does not exist or is empty"，容易误判。

### Astro 6 的 Zod 导入

Astro 6 中 `z` 需要从 `astro/zod` 导入，不再从 `astro:content` 导出：

```typescript
// ✗ Astro 5 写法
import { defineCollection, z } from 'astro:content';

// ✓ Astro 6 写法
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
```

### Tailwind 4 的配置方式

Tailwind 4 不再需要 `tailwind.config.mjs`，所有配置通过 CSS `@theme` 指令完成。
Typography 插件用 `@plugin "@tailwindcss/typography"` 在 CSS 中引入。

### Node.js 版本

Astro 6 要求 Node.js >= 22.12.0，用 nvm 管理版本切换即可。

## 后续计划？

- [ ] 暗色模式切换
- [ ] 文章搜索（Pagefind 静态搜索）
- [ ] OG 图片自动生成
- [ ] 评论系统（Giscus）
- [ ] 访问统计（Cloudflare Web Analytics）
