import { Toast } from '../hooks/useToasts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const typeStyles: Record<string, string> = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  error: 'bg-status-error/15 border-status-error/30 text-status-error',
  warning: 'bg-status-warning/15 border-status-warning/30 text-status-warning',
  info: 'bg-status-info/15 border-status-info/30 text-status-info',
};

const typeIcons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-card border shadow-bmad-lg backdrop-blur-sm min-w-[280px] max-w-[400px] animate-fade-up',
            typeStyles[toast.type]
          )}
        >
          <span className="text-lg shrink-0">{typeIcons[toast.type]}</span>
          <span className="text-caption flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); onRemove(toast.id); }}
              className="text-[11px] font-medium underline hover:no-underline shrink-0"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => onRemove(toast.id)}
            className="text-bmad-muted hover:text-bmad-text transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
