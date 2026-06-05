import type { BmadPhase } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  phases: BmadPhase[];
  onPhaseClick?: (phaseId: string) => void;
}

export default function PhaseIndicator({ phases, onPhaseClick }: Props) {
  if (phases.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-bmad-border bg-bmad-surface">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {phases.map((phase, index) => {
          const isLast = index === phases.length - 1;
          const dotColor =
            phase.status === 'completed'
              ? 'bg-emerald-500'
              : phase.status === 'current'
              ? 'bg-indigo-500'
              : 'bg-slate-400';
          const textColor =
            phase.status === 'completed'
              ? 'text-emerald-400'
              : phase.status === 'current'
              ? 'text-indigo-400 font-medium'
              : 'text-slate-400';
          const lineColor =
            phase.status === 'completed'
              ? 'bg-emerald-500'
              : 'bg-slate-600';

          return (
            <div key={phase.id} className="flex items-center shrink-0">
              <button
                onClick={() => onPhaseClick?.(phase.id)}
                disabled={phase.status === 'pending'}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded transition-all',
                  phase.status !== 'pending' && 'hover:bg-bmad-surface-raised'
                )}
                title={phase.description}
              >
                <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                <span className={cn('text-[11px] whitespace-nowrap', textColor)}>
                  {phase.label}
                </span>
              </button>
              {!isLast && (
                <div className={cn('w-4 h-px mx-1 shrink-0', lineColor)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
