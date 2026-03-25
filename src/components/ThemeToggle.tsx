import { useCallback } from 'react';
import { SunMoonIcon } from './ui/sun-moon';

export default function ThemeToggle() {
  const toggle = useCallback(() => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    html.classList.toggle('dark');

    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    setTimeout(() => html.classList.remove('theme-transition'), 300);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      aria-label="切换主题"
    >
      <SunMoonIcon size={16} className="flex items-center" />
    </button>
  );
}
