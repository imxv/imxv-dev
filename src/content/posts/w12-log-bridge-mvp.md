---
title: "log-bridge MVP 完成，开始接入 skills-cli"
description: "第 12 周进度回顾。"
date: 2026-03-14
type: weekly
tags: [weekly]
weekNumber: 12
toc: false
draft: false
---

## log-bridge

本周的主要精力在 log-bridge 的 MVP 上。核心功能已经跑通：

- `adb logcat` 日志流的捕获和解析
- 基于 PID + Level + Tag 的三层过滤
- 结构化 JSON 输出
- 写入临时文件供 Claude Code 读取

还没做的：增量更新、iOS 支持、MCP 集成。但作为 MVP 已经可以在日常开发中用起来了。

## skills-cli

开始调研 Pi SDK 的集成方案。主要在看：

- Agent 子命令的交互模式设计
- work/personal profile 的切换机制
- 与现有 skill 管理功能的整合点

下周目标是先把 agent 子命令的骨架搭起来。

## 博客

你正在看的这个博客本周上线了。技术栈是 Astro + MDX + Tailwind，部署在 Cloudflare Pages。花了一个晚上搭完，后续慢慢迭代设计。
