import { useState } from 'react';
import type { BmadAgent } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  agent: BmadAgent | null | undefined;
  onChangeAgent?: () => void;
  size?: 'sm' | 'md';
}

export default function AgentBadge({ agent, onChangeAgent, size = 'md' }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!agent) {
    return (
      <span className="text-[11px] text-bmad-muted italic">
        No agent assigned
      </span>
    );
  }

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-[11px] px-2.5 py-1';

  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onChangeAgent}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-bmad-border',
          'bg-bmad-surface-raised hover:bg-bmad-bg transition-colors',
          sizeClasses
        )}
      >
        <span className="text-base leading-none">{agent.icon}</span>
        <span className="text-bmad-text font-medium">{agent.name}</span>
        <span className="text-bmad-muted">— {agent.title}</span>
        {onChangeAgent && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-bmad-muted ml-0.5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-bmad-bg border border-bmad-border rounded-card shadow-bmad-lg p-3 max-w-xs">
          <p className="text-caption text-bmad-text font-medium mb-1">
            {agent.icon} {agent.name} — {agent.title}
          </p>
          <p className="text-[11px] text-bmad-muted leading-relaxed">
            {agent.description}
          </p>
        </div>
      )}
    </div>
  );
}
