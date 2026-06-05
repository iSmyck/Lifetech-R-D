import { useState, useEffect, useRef } from 'react';
import type { ResourceSearchResult } from '../types';
import { cn } from '../lib/utils';

interface LinkResourceModalProps {
  onClose: () => void;
  onLink: (payload: {
    type: 'jira' | 'confluence';
    external_id: string;
    title: string;
    status?: string | null;
    url?: string | null;
    include_in_ai_context: boolean;
  }) => Promise<void>;
  searchResources: (query: string, type: 'jira' | 'confluence') => void;
  clearSearch: () => void;
  searchResults: ResourceSearchResult[];
  searchLoading: boolean;
}

export default function LinkResourceModal({
  onClose,
  onLink,
  searchResources,
  clearSearch,
  searchResults,
  searchLoading,
}: LinkResourceModalProps) {
  const [step, setStep] = useState<'type' | 'search'>('type');
  const [resourceType, setResourceType] = useState<'jira' | 'confluence' | null>(null);
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<ResourceSearchResult | null>(null);
  const [includeInAI, setIncludeInAI] = useState(true);
  const [linking, setLinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'search' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (resourceType && query.length >= 2) {
      const timer = setTimeout(() => searchResources(query, resourceType), 200);
      return () => clearTimeout(timer);
    }
  }, [query, resourceType, searchResources]);

  const handleLink = async () => {
    if (!selectedResult || !resourceType) return;
    setLinking(true);
    await onLink({
      type: resourceType,
      external_id: selectedResult.external_id,
      title: selectedResult.title,
      status: selectedResult.status ?? null,
      url: selectedResult.url ?? null,
      include_in_ai_context: includeInAI,
    });
    setLinking(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} data-testid="link-resource-modal">
      <div
        className="bg-bmad-surface rounded-modal p-5 max-w-lg w-full mx-4 border border-bmad-border shadow-bmad-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-heading font-semibold text-bmad-text">Link Resource</h3>
          <button onClick={onClose} className="text-bmad-muted hover:text-bmad-text transition-colors" data-testid="close-modal">
            ✕
          </button>
        </div>

        {step === 'type' && (
          <div className="space-y-3">
            <p className="text-caption text-bmad-muted">Choose the type of resource to link</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setResourceType('jira');
                  setStep('search');
                }}
                className="flex flex-col items-center p-4 rounded-card bg-bmad-surface-raised border border-bmad-border hover:border-bmad-primary/30 hover:shadow-bmad-sm transition-all"
                data-testid="select-jira"
              >
                <span className="text-2xl mb-2">🔵</span>
                <span className="text-caption font-medium text-bmad-text">Jira Ticket</span>
                <span className="text-[10px] text-bmad-muted mt-1">Link a ticket, epic, or story</span>
              </button>
              <button
                onClick={() => {
                  setResourceType('confluence');
                  setStep('search');
                }}
                className="flex flex-col items-center p-4 rounded-card bg-bmad-surface-raised border border-bmad-border hover:border-bmad-primary/30 hover:shadow-bmad-sm transition-all"
                data-testid="select-confluence"
              >
                <span className="text-2xl mb-2">🟣</span>
                <span className="text-caption font-medium text-bmad-text">Confluence Page</span>
                <span className="text-[10px] text-bmad-muted mt-1">Link a documentation page</span>
              </button>
            </div>
          </div>
        )}

        {step === 'search' && resourceType && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setStep('type');
                setQuery('');
                setSelectedResult(null);
                clearSearch();
              }}
              className="text-[11px] text-bmad-primary hover:underline"
            >
              ← Back to type selection
            </button>

            <div>
              <label className="text-caption text-bmad-muted mb-1 block">
                {resourceType === 'jira' ? 'Search Jira tickets' : 'Search Confluence pages'}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedResult(null);
                }}
                placeholder={
                  resourceType === 'jira'
                    ? 'Type ticket ID (e.g., PROD-442) or keywords…'
                    : 'Type page title or space key…'
                }
                className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text placeholder:text-bmad-muted/50 focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
                data-testid="resource-search-input"
              />
            </div>

            {searchLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-bmad-surface-raised rounded-card p-3 border border-bmad-border/50 animate-shimmer h-16" />
                ))}
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {searchResults.map((result) => (
                  <button
                    key={result.external_id}
                    onClick={() => setSelectedResult(result)}
                    className={cn(
                      'w-full text-left bg-bmad-surface-raised rounded-card p-3 border transition-all',
                      selectedResult?.external_id === result.external_id
                        ? 'border-bmad-primary ring-1 ring-bmad-primary/30'
                        : 'border-bmad-border/50 hover:border-bmad-primary/20'
                    )}
                    data-testid="search-result"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase', resourceType === 'jira' ? 'bg-blue-600/20 text-blue-400' : 'bg-bmad-primary/20 text-bmad-primary-light')}>
                        {resourceType === 'jira' ? 'Jira' : 'Confluence'}
                      </span>
                      <span className="text-caption font-medium text-bmad-text">{result.external_id}</span>
                    </div>
                    <div className="text-body text-bmad-text mt-1">{result.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-bmad-muted">
                      {result.status && <span>{result.status}</span>}
                      {result.assignee && <span>{result.assignee}</span>}
                      {result.space_name && <span>{result.space_name}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searchLoading && query.length >= 2 && searchResults.length === 0 && (
              <p className="text-caption text-bmad-muted text-center py-4">No results found</p>
            )}

            <label className="flex items-center gap-2 text-caption text-bmad-text">
              <input
                type="checkbox"
                checked={includeInAI}
                onChange={(e) => setIncludeInAI(e.target.checked)}
                className="rounded border-bmad-border"
              />
              Include in AI context
            </label>

            <button
              onClick={handleLink}
              disabled={!selectedResult || linking}
              className="w-full bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white py-2.5 rounded-button text-body font-medium transition-all shadow-bmad-sm"
              data-testid="link-resource-btn"
            >
              {linking ? 'Linking…' : 'Link Resource'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
