import { useState } from 'react';
import LLMSettingsTab from './LLMSettingsTab';
import { useLLMConfig } from '../hooks/useLLMConfig';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'llm', label: 'AI Model' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'advanced', label: 'Advanced' },
] as const;

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<string>('llm');
  const { config, providers, loading, testing, testResult, error, saveConfig, testConnection } = useLLMConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose} data-testid="settings-modal">
      <div className="relative bg-bmad-surface rounded-modal max-w-2xl w-full mx-4 border border-bmad-border shadow-bmad-lg flex overflow-hidden" style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-bmad-border bg-bmad-surface-raised/50 p-3">
          <div className="text-heading font-semibold text-bmad-text mb-4 px-2">Settings</div>
          <nav className="space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-button text-caption transition-colors',
                  activeTab === tab.id
                    ? 'bg-bmad-primary/10 text-bmad-primary font-medium'
                    : 'text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto scrollbar-thin">
          {activeTab === 'llm' && (
            <>
              <h3 className="text-heading font-semibold text-bmad-text mb-4">AI Model Configuration</h3>
              <LLMSettingsTab
                config={config}
                providers={providers}
                loading={loading}
                testing={testing}
                testResult={testResult}
                error={error}
                onSave={saveConfig}
                onTest={testConnection}
              />
            </>
          )}
          {activeTab !== 'llm' && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-caption text-bmad-muted">{TABS.find((t) => t.id === activeTab)?.label} settings coming soon</p>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-bmad-muted hover:text-bmad-text transition-colors p-1"
          data-testid="close-settings"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
