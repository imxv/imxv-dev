export interface NowItem {
  text: string;
  status: 'active' | 'paused' | 'done';
  detail?: string;
}

export interface NowSection {
  title: string;
  items: NowItem[];
}

export const NOW_UPDATED = '2026-03-20';

export const nowSections: NowSection[] = [
  {
    title: '正在做',
    items: [
      {
        text: '探索 Claude Code 在 Native 开发中的反馈循环方案',
        status: 'active',
        detail:
          '核心思路是通过 log-bridge 把设备日志流式桥接到 Claude Code 的上下文中，当前在做过滤层。',
      },
      {
        text: '给 skills-cli 加 agent 子命令（Pi SDK）',
        status: 'active',
        detail:
          '嵌入 Pi SDK，实现 work/personal profile 分离，让 CLI 工具长出 agent 能力。',
      },
      {
        text: 'KDS-React → Solid 编译管线（Kope）优化',
        status: 'active',
      },
    ],
  },
  {
    title: '近期目标',
    items: [
      { text: 'log-bridge MVP 可用', status: 'active' },
      { text: 'skills-cli v0.2 发布', status: 'paused' },
      { text: '博客上线并发布第一篇文章', status: 'active' },
    ],
  },
];
