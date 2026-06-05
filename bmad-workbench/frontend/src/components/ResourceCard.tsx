import { useState } from 'react';
import type { Resource } from '../types';
import { cn } from '../lib/utils';

interface ResourceCardProps {
  resource: Resource;
  onUnlink: (id: string) => void;
}

export default function ResourceCard({ resource, onUnlink }: ResourceCardProps) {
  const [hovered, setHovered] = useState(false);

  const isJira = resource.type === 'jira';

  return (
    <a
      href={resource.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-bmad-surface-raised rounded-card p-3 hover:bg-bmad-border/20 transition-all border border-bmad-border/50 hover:border-bmad-primary/20 relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="resource-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0',
              isJira ? 'bg-blue-600/20 text-blue-500 dark:text-blue-400' : 'bg-bmad-primary/20 text-bmad-primary'
            )}
          >
            {isJira ? 'Jira' : 'Confluence'}
          </span>
          <span className="text-caption font-medium text-bmad-text truncate">
            {resource.external_id}: {resource.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hovered && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnlink(resource.id);
              }}
              className="text-bmad-muted hover:text-status-error transition-colors p-1"
              title="Unlink"
              data-testid="unlink-resource"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        {resource.status && (
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              resource.status === 'Done'
                ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400'
                : resource.status === 'In Progress'
                ? 'bg-amber-600/20 text-amber-600 dark:text-amber-400'
                : 'bg-slate-600/20 text-slate-600 dark:text-slate-400'
            )}
          >
            {resource.status}
          </span>
        )}
        <span className="text-[10px] text-bmad-muted">
          Linked {new Date(resource.created_at).toLocaleDateString()}
        </span>
      </div>
    </a>
  );
}
