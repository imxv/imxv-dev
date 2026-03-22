---
title: "TIL: adb logcat 的 --pid 参数可以过滤单进程日志"
description: "一个简单但实用的 adb 技巧。"
date: 2026-03-16
type: til
tags: [android, tooling]
toc: false
draft: false
---

之前一直在用 `adb logcat | grep` 的方式过滤日志，今天发现 `adb logcat` 原生支持 `--pid` 参数：

```bash
# 先拿到进程 ID
PID=$(adb shell pidof com.example.app)

# 只看这个进程的日志
adb logcat --pid=$PID
```

比 `grep` 更精确，不会漏掉多行日志，也不会误匹配到其他进程中碰巧包含相同关键字的日志。

配合 `-s` 参数还能进一步过滤 tag：

```bash
adb logcat --pid=$PID -s MyTag:W
```

这在 log-bridge 项目中直接用上了，作为过滤层的第一道关卡。
