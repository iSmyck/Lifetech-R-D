import { useState, useEffect, useRef } from 'react';
import type { Stakeholder } from '../hooks/useStakeholders';
import { cn } from '../lib/utils';

interface UserResult {
  id: string;
  display_name: string;
  email: string;
  department: string;
}

interface StakeholderPickerProps {
  onClose: () => void;
  onAdd: (userId: string, role: string) => Promise<void>;
  existingStakeholders: Stakeholder[];
}

const ROLE_OPTIONS = [
  { value: 'accountable', label: 'Accountable (A)', description: 'The one who ultimately approves' },
  { value: 'responsible', label: 'Responsible (R)', description: 'The one who does the work' },
  { value: 'consulted', label: 'Consulted (C)', description: 'Those whose opinions are sought' },
  { value: 'informed', label: 'Informed (I)', description: 'Those kept up-to-date' },
] as const;

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export default function StakeholderPicker({ onClose, onAdd, existingStakeholders }: StakeholderPickerProps) {
  const [step, setStep] = useState<'search' | 'role'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('consulted');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const resp = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`);
        if (resp.ok) {
          const data = await resp.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.warn('User search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const existingIds = new Set(existingStakeholders.map((s) => s.user_id));

  const handleNext = () => {
    if (selectedUser) setStep('role');
  };

  const handleAdd = async () => {
    if (!selectedUser) return;
    setAdding(true);
    await onAdd(selectedUser.id, selectedRole);
    setAdding(false);
    onClose();
  };

  const getCurrentOccupants = (role: string) => {
    return existingStakeholders.filter((s) => s.role === role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} data-testid="stakeholder-picker">
      <div className="bg-bmad-surface rounded-modal p-5 max-w-md w-full mx-4 border border-bmad-border shadow-bmad-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading font-semibold text-bmad-text">Add Stakeholder</h3>
          <button onClick={onClose} className="text-bmad-muted hover:text-bmad-text transition-colors">✕</button>
        </div>

        {step === 'search' && (
          <div className="space-y-3">
            <div>
              <label className="text-caption text-bmad-muted mb-1 block">Search directory</label>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Search by name or email…"
                className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text placeholder:text-bmad-muted/50 focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
                data-testid="stakeholder-search-input"
              />
            </div>

            {searchLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-bmad-surface-raised rounded-card p-3 border border-bmad-border/50 animate-shimmer h-14" />
                ))}
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {searchResults.map((user) => {
                  const alreadyAdded = existingIds.has(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => !alreadyAdded && setSelectedUser(user)}
                      disabled={alreadyAdded}
                      className={cn(
                        'w-full text-left bg-bmad-surface-raised rounded-card p-3 border transition-all flex items-center gap-3',
                        alreadyAdded
                          ? 'opacity-50 cursor-not-allowed border-bmad-border/30'
                          : selectedUser?.id === user.id
                          ? 'border-bmad-primary ring-1 ring-bmad-primary/30'
                          : 'border-bmad-border/50 hover:border-bmad-primary/20'
                      )}
                      data-testid="user-result"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bmad-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {user.display_name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-caption font-medium text-bmad-text">{user.display_name}</span>
                          {alreadyAdded && <span className="text-[10px] bg-bmad-border text-bmad-muted px-1.5 py-0.5 rounded">Already added</span>}
                        </div>
                        <div className="text-[10px] text-bmad-muted">{user.email}</div>
                        <div className="text-[10px] text-bmad-muted">{user.department}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!selectedUser}
              className="w-full bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white py-2.5 rounded-button text-body font-medium transition-all shadow-bmad-sm"
              data-testid="next-btn"
            >
              Next
            </button>
          </div>
        )}

        {step === 'role' && selectedUser && (
          <div className="space-y-3">
            <p className="text-caption text-bmad-text">
              Assign role to <span className="font-medium">{selectedUser.display_name}</span>
            </p>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => {
                const occupants = getCurrentOccupants(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-all',
                      selectedRole === opt.value
                        ? 'border-bmad-primary bg-bmad-primary/5'
                        : 'border-bmad-border/50 hover:border-bmad-border'
                    )}
                  >
                    <input
                      type="radio"
                      name="raci-role"
                      value={opt.value}
                      checked={selectedRole === opt.value}
                      onChange={() => setSelectedRole(opt.value)}
                      className="mt-1"
                      data-testid={`role-${opt.value}`}
                    />
                    <div>
                      <div className="text-caption font-medium text-bmad-text">{opt.label}</div>
                      <div className="text-[10px] text-bmad-muted">{opt.description}</div>
                      {occupants.length > 0 && (
                        <div className="text-[10px] text-bmad-muted mt-1">
                          Currently: {occupants.map((o) => o.user?.display_name || o.user_id).join(', ')}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('search')}
                className="flex-1 bg-bmad-surface-raised hover:bg-bmad-border text-bmad-text py-2.5 rounded-button text-body font-medium transition-all border border-bmad-border"
              >
                Back
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white py-2.5 rounded-button text-body font-medium transition-all shadow-bmad-sm"
                data-testid="add-stakeholder-btn"
              >
                {adding ? 'Adding…' : 'Add Stakeholder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
