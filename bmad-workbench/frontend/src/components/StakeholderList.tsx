import { useState, useRef, useEffect } from 'react';
import type { Stakeholder } from '../hooks/useStakeholders';
import { cn } from '../lib/utils';

interface StakeholderListProps {
  stakeholders: Stakeholder[];
  onRemove: (userId: string) => void;
  onChangeRole: (userId: string, role: string) => void;
  onRequestReview: (userId: string) => void;
}

const ROLE_ORDER = ['accountable', 'responsible', 'consulted', 'informed'] as const;

const ROLE_LABEL: Record<string, string> = {
  accountable: 'Accountable (A)',
  responsible: 'Responsible (R)',
  consulted: 'Consulted (C)',
  informed: 'Informed (I)',
};

const ROLE_BADGE: Record<string, string> = {
  accountable: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  responsible: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  consulted: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  informed: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

function StakeholderMenu({
  s,
  groupRole,
  onRemove,
  onChangeRole,
  onRequestReview,
}: {
  s: Stakeholder;
  groupRole: string;
  onRemove: (userId: string) => void;
  onChangeRole: (userId: string, role: string) => void;
  onRequestReview: (userId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-bmad-muted hover:text-bmad-text transition-colors"
        data-testid="stakeholder-menu"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-bmad-surface rounded-card border border-bmad-border shadow-bmad-lg z-50 py-1">
          {(groupRole === 'accountable' || groupRole === 'responsible') && (
            <button
              onClick={() => {
                onRequestReview(s.user_id);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-caption text-bmad-text hover:bg-bmad-surface-raised transition-colors"
            >
              Request Review
            </button>
          )}
          {ROLE_ORDER.filter((r) => r !== s.role).map((r) => (
            <button
              key={r}
              onClick={() => {
                onChangeRole(s.user_id, r);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-caption text-bmad-text hover:bg-bmad-surface-raised transition-colors"
            >
              Change to {ROLE_LABEL[r]}
            </button>
          ))}
          <div className="border-t border-bmad-border my-1" />
          <button
            onClick={() => {
              onRemove(s.user_id);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-caption text-status-error hover:bg-bmad-surface-raised transition-colors"
            data-testid="remove-stakeholder"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default function StakeholderList({ stakeholders, onRemove, onChangeRole, onRequestReview }: StakeholderListProps) {
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_LABEL[role],
    items: stakeholders.filter((s) => s.role === role),
  }));

  return (
    <div className="space-y-4" data-testid="stakeholder-list">
      {grouped.map((group) => (
        <div key={group.role}>
          <h4 className="text-label text-bmad-muted uppercase mb-2">{group.label}</h4>
          {group.items.length === 0 ? (
            <p className="text-[11px] text-bmad-muted italic">No one assigned</p>
          ) : (
            <div className="space-y-2">
              {group.items.map((s) => (
                <div
                  key={s.user_id}
                  className="flex items-center justify-between bg-bmad-surface-raised rounded-card px-3 py-2 border border-bmad-border/50 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-bmad-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {s.user?.display_name?.split(' ').map((n) => n[0]).join('') || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-body text-bmad-text truncate">{s.user?.display_name || s.user_id}</div>
                      <div className="text-[10px] text-bmad-muted truncate">{s.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide',
                        ROLE_BADGE[s.role]
                      )}
                    >
                      {s.role}
                    </span>
                    <StakeholderMenu
                      s={s}
                      groupRole={group.role}
                      onRemove={onRemove}
                      onChangeRole={onChangeRole}
                      onRequestReview={onRequestReview}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
