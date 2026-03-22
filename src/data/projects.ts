export interface Project {
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  tags: string[];
  github?: string;
  url?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    name: 'skills-cli',
    description:
      '管理 OpenClaw skills 的命令行工具，正在演化为嵌入 Pi SDK 的个人 dev copilot。',
    status: 'active',
    tags: ['TypeScript', 'CLI', 'Agent'],
    featured: true,
  },
  {
    name: 'log-bridge',
    description:
      '打通 Claude Code 与 Native 移动端模拟器/真机之间的日志反馈循环。',
    status: 'active',
    tags: ['Developer Tools', 'AI-assisted Dev'],
    featured: true,
  },
];
