import { useState } from 'react';
import type { Stakeholder } from '../hooks/useStakeholders';

interface ReviewRequestModalProps {
  stakeholders: Stakeholder[];
  onClose: () => void;
  onSubmit: (reviewerIds: string[], message: string) => Promise<void>;
}

export default function ReviewRequestModal({ stakeholders, onClose, onSubmit }: ReviewRequestModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    stakeholders.forEach((s) => {
      if (s.role === 'accountable' || s.role === 'responsible') {
        defaults.add(s.user_id);
      }
    });
    return defaults;
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    await onSubmit(Array.from(selectedIds), message);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} data-testid="review-request-modal">
      <div className="bg-bmad-surface rounded-modal p-5 max-w-md w-full mx-4 border border-bmad-border shadow-bmad-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading font-semibold text-bmad-text">Request Review</h3>
          <button onClick={onClose} className="text-bmad-muted hover:text-bmad-text transition-colors">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-caption text-bmad-muted mb-1 block">Select reviewers</label>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin border border-bmad-border/50 rounded-card p-2">
              {stakeholders.length === 0 ? (
                <p className="text-caption text-bmad-muted text-center py-2">No stakeholders available</p>
              ) : (
                stakeholders.map((s) => (
                  <label key={s.user_id} className="flex items-center gap-2 p-2 rounded hover:bg-bmad-surface-raised cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.user_id)}
                      onChange={() => toggle(s.user_id)}
                      className="rounded border-bmad-border"
                    />
                    <div className="min-w-0">
                      <div className="text-caption text-bmad-text">{s.user?.display_name || s.user_id}</div>
                      <div className="text-[10px] text-bmad-muted">{s.role}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-caption text-bmad-muted mb-1 block">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please review the Q3 PRD draft. Focus on the API contract section."
              rows={3}
              className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text placeholder:text-bmad-muted/50 resize-none focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || submitting}
            className="w-full bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white py-2.5 rounded-button text-body font-medium transition-all shadow-bmad-sm"
            data-testid="send-review-btn"
          >
            {submitting ? 'Sending…' : 'Send Review Requests'}
          </button>
        </div>
      </div>
    </div>
  );
}
