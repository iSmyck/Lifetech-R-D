import { useState, useRef, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  shortcut?: string;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ children, content, shortcut, delay = 500, position = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className={cn('absolute z-50 px-2 py-1 rounded-button bg-bmad-bg border border-bmad-border shadow-bmad-lg whitespace-nowrap pointer-events-none', positionClasses[position])}>
          <span className="text-[11px] text-bmad-text">{content}</span>
          {shortcut && (
            <span className="text-[10px] text-bmad-muted ml-1.5">({shortcut})</span>
          )}
        </div>
      )}
    </div>
  );
}
