---
title: "当 Claude Code 看不到你的模拟器：Native 开发的日志桥方案"
description: "探索用日志桥打通 AI 辅助编码在 Native 移动端的反馈循环断裂。"
date: 2026-03-18
type: article
tags: [tooling, agent, mobile]
toc: true
draft: false
---

## 问题：断裂的反馈循环

Claude Code 在 Web 和后端开发中表现优异，核心原因是它能直接看到运行结果——终端输出、测试结果、编译错误。但在 Native 移动端开发中，这个反馈循环是断裂的。

你的应用运行在模拟器或真机上，日志在 `adb logcat` 或 Xcode Console 里翻滚，而 Claude Code 对这一切一无所知。

## 思路：日志桥

核心想法很简单：把设备日志流式桥接到 Claude Code 可以读取的地方。

```bash
# 最简单的形式
adb logcat --pid=$(adb shell pidof com.example.app) | tee /tmp/app.log
```

但这远远不够。原始 logcat 输出噪音太多，Claude Code 需要的是经过过滤和结构化的日志流。

## 实现方案

### 1. 过滤层

第一步是降噪。我们需要：

- **进程级过滤**：只关注目标应用的日志
- **级别过滤**：开发时通常只需要 WARN 及以上
- **关键字过滤**：聚焦到特定模块或功能

```typescript
interface LogFilter {
  pid?: number;
  minLevel: 'V' | 'D' | 'I' | 'W' | 'E';
  tags?: string[];
  keywords?: string[];
}
```

### 2. 结构化输出

原始日志行需要解析为结构化数据：

```typescript
interface LogEntry {
  timestamp: string;
  level: string;
  tag: string;
  message: string;
  pid: number;
}
```

### 3. 上下文注入

最后一步是把过滤后的日志注入到 Claude Code 的工作上下文中。目前在探索几种方式：

- 写入文件，让 Claude Code 通过 `Read` 工具读取
- 通过 MCP Server 暴露为工具
- 利用 Claude Code 的 hook 机制自动触发

## 当前进展

过滤层的基本实现已经完成，正在做 MCP Server 的集成。下一步是处理日志的增量更新——避免每次都读取全量日志。

## 下一步

- [ ] 增量日志读取（基于行号偏移）
- [ ] iOS 支持（`xcrun simctl` 日志流）
- [ ] Crash 日志的特殊处理
- [ ] 与 Claude Code hook 系统集成
