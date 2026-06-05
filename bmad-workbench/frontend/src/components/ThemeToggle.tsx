import { useTheme, type Theme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'Auto', icon: '🖥️' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center bg-bmad-surface-raised border border-bmad-border rounded-button p-0.5 gap-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            'px-2 py-1 rounded-[4px] text-[11px] font-medium transition-all flex items-center gap-1',
            theme === opt.value
              ? 'bg-bmad-primary text-white shadow-bmad-sm'
              : 'text-bmad-muted hover:text-bmad-text'
          )}
          title={`${opt.label} mode`}
          aria-pressed={theme === opt.value}
        >
          <span className="text-xs">{opt.icon}</span>
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
