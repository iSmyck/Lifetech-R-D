import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useDocumentPreview } from '../hooks/useDocumentPreview';
import { useAttachments } from '../hooks/useAttachments';
import { useResources } from '../hooks/useResources';
import ResourceCard from './ResourceCard';
import LinkResourceModal from './LinkResourceModal';
import { useStakeholders, useReviews } from '../hooks/useStakeholders';
import StakeholderPicker from './StakeholderPicker';
import StakeholderList from './StakeholderList';
import ReviewRequestModal from './ReviewRequestModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = ['Document', 'Stakeholders', 'Attachments', 'Resources'] as const;
type Tab = (typeof TABS)[number];



function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('markdown') || mimeType.includes('text')) return '📝';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📃';
  return '📎';
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center px-2">
      <div className="w-10 h-10 rounded-card bg-bmad-surface-raised flex items-center justify-center mb-3">
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-caption text-bmad-text font-medium mb-1">{title}</p>
      <p className="text-[11px] text-bmad-muted">{subtitle}</p>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-bmad-border rounded animate-shimmer', className)} />
  );
}

export default function ContextPanel() {
  const { layout, setLayout, activeThreadId } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('Document');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showStakeholderPicker, setShowStakeholderPicker] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { document: docDetail, loading: docLoading } = useDocumentPreview(activeThreadId);

  const {
    attachments,
    loading: attLoading,
    uploads,
    dragOver,
    uploadFile,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  } = useAttachments(activeThreadId);

  const {
    resources,
    loading: resLoading,
    searchLoading,
    searchResults,
    setSearchResults,
    searchResources,
    linkResource,
    unlinkResource,
  } = useResources(activeThreadId);

  const {
    stakeholders,
    loading: stakeholdersLoading,
    addStakeholder,
    updateRole,
    removeStakeholder,
  } = useStakeholders(activeThreadId);

  const { requestReview } = useReviews(docDetail?.id || null);

  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = layout.rightWidth;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(280, Math.min(600, startWidth - delta));
      setLayout({ rightWidth: newWidth });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const activeProjectId = 'default-project';
    Array.from(files).forEach((file) => uploadFile(file, activeProjectId));
    e.target.value = '';
  };

  const currentRevisionContent = docDetail?.current_revision?.content || '';

  return (
    <aside
      className="relative flex flex-col border-l border-bmad-border bg-bmad-surface shrink-0"
      style={{ width: layout.rightWidth }}
      data-testid="context-panel"
    >
      {/* Tabs */}
      <div className="flex border-b border-bmad-border overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 px-3 py-3 text-label whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'text-bmad-primary border-b-2 border-bmad-primary'
                : 'text-bmad-muted hover:text-bmad-text'
            )}
            data-testid={`tab-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeTab === 'Document' && (
          <div data-testid="document-tab">
            {docLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : currentRevisionContent ? (
              <div className="bg-white text-slate-900 rounded-card p-4 min-h-[200px] shadow-bmad-sm">
                <h4 className="text-heading font-semibold mb-2 text-slate-800">
                  {docDetail?.title || 'Untitled'}
                </h4>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentRevisionContent}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <EmptyState
                icon="📝"
                title="No draft yet"
                subtitle="Your PRD will appear here after the AI generates it"
              />
            )}
          </div>
        )}

        {activeTab === 'Stakeholders' && (
          <div data-testid="stakeholders-tab">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-label text-bmad-muted uppercase">Stakeholders</h4>
              <button
                onClick={() => setShowStakeholderPicker(true)}
                className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-2.5 py-1 rounded-button transition-all shadow-bmad-sm"
                data-testid="add-stakeholder-btn"
              >
                + Add
              </button>
            </div>
            {stakeholdersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-bmad-surface-raised rounded-card p-3 border border-bmad-border/50 animate-shimmer h-14" />
                ))}
              </div>
            ) : stakeholders.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No stakeholders"
                subtitle="Add stakeholders to assign RACI roles and request reviews"
              />
            ) : (
              <StakeholderList
                stakeholders={stakeholders}
                onRemove={removeStakeholder}
                onChangeRole={updateRole}
                onRequestReview={() => setShowReviewModal(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'Attachments' && (
          <div
            className={cn(
              'space-y-3',
              dragOver && 'ring-2 ring-bmad-primary/50 rounded-panel'
            )}
            data-testid="attachments-tab"
            onDrop={(e) => {
              const activeProjectId = 'default-project';
              handleDrop(e, activeProjectId);
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-label text-bmad-muted uppercase">Attachments</h4>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={onFileSelect}
                />
                <button
                  className="text-caption bg-bmad-surface-raised hover:bg-bmad-border text-bmad-text px-2.5 py-1 rounded-button transition-all border border-bmad-border"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Upload progress */}
            {uploads.length > 0 && (
              <div className="space-y-2">
                {uploads.map((u, i) => (
                  <div key={`${u.file.name}-${i}`} className="bg-bmad-surface-raised rounded-card p-2 border border-bmad-border/50">
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-bmad-text truncate max-w-[140px]">{u.file.name}</span>
                      <span className={cn(
                        'text-[10px]',
                        u.status === 'error' ? 'text-status-error' : 'text-bmad-muted'
                      )}>
                        {u.status === 'uploading' ? `${u.progress}%` : u.status}
                      </span>
                    </div>
                    {u.status === 'uploading' && (
                      <div className="w-full bg-bmad-border rounded-full h-1 mt-1">
                        <div
                          className="bg-bmad-primary h-1 rounded-full transition-all"
                          style={{ width: `${u.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Drag-over hint */}
            {dragOver && (
              <div className="border-2 border-dashed border-bmad-primary/50 rounded-card p-4 text-center">
                <p className="text-caption text-bmad-primary">Drop files here to upload</p>
              </div>
            )}

            {/* Attachments grid */}
            {attLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-bmad-surface-raised rounded-card p-3 border border-bmad-border/50">
                    <Skeleton className="w-6 h-6 mb-2" />
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-2 w-10" />
                  </div>
                ))}
              </div>
            ) : attachments.length === 0 ? (
              <EmptyState
                icon="📎"
                title="No attachments"
                subtitle="Drag and drop meeting notes, requirements, or reference docs"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => setPreviewAttachment(att.id)}
                    className={cn(
                      'bg-bmad-surface-raised rounded-card p-3 text-left border border-bmad-border/50 hover:border-bmad-primary/30 transition-all',
                      att.status === 'error' && 'border-status-error/30',
                      att.status === 'processing' && 'border-status-warning/30'
                    )}
                  >
                    <div className="text-lg">{getFileIcon(att.mime_type)}</div>
                    <div className="text-caption font-medium text-bmad-text truncate mt-1">{att.filename}</div>
                    <div className="text-[10px] text-bmad-muted mt-1">{formatBytes(att.size_bytes)}</div>
                    <div className={cn(
                      'text-[10px] mt-1 uppercase font-medium',
                      att.status === 'ready' && 'text-emerald-400',
                      att.status === 'processing' && 'text-amber-400',
                      att.status === 'error' && 'text-status-error',
                      att.status === 'uploading' && 'text-bmad-primary',
                    )}>
                      {att.status}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Preview modal */}
            {previewAttachment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewAttachment(null)}>
                <div className="bg-bmad-surface rounded-modal p-4 max-w-md w-full mx-4 border border-bmad-border shadow-bmad-lg" onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    const att = attachments.find((a) => a.id === previewAttachment);
                    if (!att) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-body font-semibold text-bmad-text">{att.filename}</h4>
                          <button onClick={() => setPreviewAttachment(null)} className="text-bmad-muted hover:text-bmad-text text-caption">✕</button>
                        </div>
                        <div className="bg-bmad-bg rounded-card p-3 max-h-60 overflow-y-auto border border-bmad-border/50">
                          {att.parsed_text ? (
                            <pre className="text-caption text-bmad-text whitespace-pre-wrap">{att.parsed_text}</pre>
                          ) : (
                            <p className="text-caption text-bmad-muted">No parsed text available yet.</p>
                          )}
                        </div>
                        <div className="mt-3 text-[10px] text-bmad-muted">
                          Status: <span className={cn(
                            att.status === 'ready' && 'text-emerald-400',
                            att.status === 'processing' && 'text-amber-400',
                            att.status === 'error' && 'text-status-error',
                          )}>{att.status}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Resources' && (
          <div data-testid="resources-tab">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-label text-bmad-muted uppercase">Linked Resources</h4>
              <button
                onClick={() => setShowLinkModal(true)}
                className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-2.5 py-1 rounded-button transition-all shadow-bmad-sm"
                data-testid="link-resource-btn"
              >
                Link Resource
              </button>
            </div>
            {resLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-bmad-surface-raised rounded-card p-3 border border-bmad-border/50 animate-shimmer h-16" />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <EmptyState
                icon="🔗"
                title="No linked resources yet"
                subtitle="Link Jira tickets and Confluence pages to give the AI context about your work"
              />
            ) : (
              <div className="space-y-2">
                <span className="text-caption text-bmad-muted">{resources.length} items</span>
                {resources.map((res) => (
                  <ResourceCard key={res.id} resource={res} onUnlink={unlinkResource} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showLinkModal && (
        <LinkResourceModal
          onClose={() => setShowLinkModal(false)}
          onLink={async (payload) => {
            await linkResource(payload);
          }}
          searchResources={searchResources}
          clearSearch={() => setSearchResults([])}
          searchResults={searchResults}
          searchLoading={searchLoading}
        />
      )}

      {showStakeholderPicker && (
        <StakeholderPicker
          onClose={() => setShowStakeholderPicker(false)}
          onAdd={async (userId, role) => {
            await addStakeholder(userId, role);
          }}
          existingStakeholders={stakeholders}
        />
      )}

      {showReviewModal && (
        <ReviewRequestModal
          stakeholders={stakeholders}
          onClose={() => setShowReviewModal(false)}
          onSubmit={async (reviewerIds, message) => {
            await requestReview(reviewerIds, message);
          }}
        />
      )}

      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-bmad-primary/50 transition-colors z-10"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
