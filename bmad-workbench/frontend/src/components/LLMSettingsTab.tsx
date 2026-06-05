import { useState, useEffect } from 'react';
import type { LLMConfig, ProviderInfo, TestResult } from '../hooks/useLLMConfig';
import { cn } from '../lib/utils';

interface LLMSettingsTabProps {
  config: LLMConfig | null;
  providers: ProviderInfo[];
  loading: boolean;
  testing: boolean;
  testResult: TestResult | null;
  error: string | null;
  onSave: (payload: LLMConfig) => Promise<void>;
  onTest: (payload: LLMConfig) => Promise<void>;
}

export default function LLMSettingsTab({
  config,
  providers,
  loading,
  testing,
  testResult,
  error,
  onSave,
  onTest,
}: LLMSettingsTabProps) {
  const [provider, setProvider] = useState(config?.provider || 'vllm');
  const [baseUrl, setBaseUrl] = useState(config?.base_url || '');
  const [apiKey, setApiKey] = useState(config?.api_key || '');
  const [modelName, setModelName] = useState(config?.model_name || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const selectedProvider = providers.find((p) => p.id === provider);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setBaseUrl(config.base_url || '');
      setApiKey(config.api_key || '');
      setModelName(config.model_name || '');
    }
  }, [config]);

  useEffect(() => {
    if (selectedProvider) {
      if (!baseUrl && selectedProvider.default_base_url) {
        setBaseUrl(selectedProvider.default_base_url);
      }
      // Always reset modelName to first default model when provider changes
      if (selectedProvider.default_models.length > 0) {
        setModelName(selectedProvider.default_models[0]);
      } else {
        setModelName('');
      }
    }
  }, [provider, selectedProvider]);

  const currentPayload: LLMConfig = {
    provider,
    base_url: baseUrl || null,
    api_key: apiKey || null,
    model_name: modelName,
  };

  const needsBaseUrl = selectedProvider?.fields.includes('base_url');
  const needsApiKey = selectedProvider?.fields.includes('api_key');
  const needsModelName = selectedProvider?.fields.includes('model_name');

  return (
    <div className="space-y-4" data-testid="llm-settings-tab">
      {error && (
        <div className="bg-red-500/10 rounded-card p-3 border border-red-500/20 text-caption text-red-600 dark:text-red-400">
          <div className="font-medium">✗ Configuration Error</div>
          <div className="text-[11px] mt-1">{error}</div>
        </div>
      )}

      {config?.is_active && !error && (
        <div className="bg-bmad-surface-raised rounded-card p-3 border border-bmad-border/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="text-caption text-bmad-text font-medium">Connected</span>
          </div>
          <div className="text-body text-bmad-text mt-1">
            {config.provider} — {config.model_name}
          </div>
        </div>
      )}

      <div>
        <label className="text-caption text-bmad-muted mb-1 block">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
          data-testid="provider-select"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {needsBaseUrl && (
        <div>
          <label className="text-caption text-bmad-muted mb-1 block">API Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={selectedProvider?.default_base_url || 'https://api.example.com/v1'}
            className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text placeholder:text-bmad-muted/50 focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
            data-testid="base-url-input"
          />
        </div>
      )}

      {needsModelName && (
        <div>
          <label className="text-caption text-bmad-muted mb-1 block">Model Name</label>
          {selectedProvider && selectedProvider.default_models.length > 0 ? (
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
              data-testid="model-select"
            >
              {selectedProvider.default_models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., gpt-4"
              className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 text-body text-bmad-text placeholder:text-bmad-muted/50 focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
            />
          )}
        </div>
      )}

      {needsApiKey && (
        <div>
          <label className="text-caption text-bmad-muted mb-1 block">API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2 pr-16 text-body text-bmad-text placeholder:text-bmad-muted/50 focus:outline-none focus:ring-1 focus:ring-bmad-primary/50"
              data-testid="api-key-input"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-bmad-muted hover:text-bmad-text transition-colors"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      )}

      {testResult && (
        <div
          className={cn(
            'rounded-card p-3 border text-caption',
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          )}
          data-testid="test-result"
        >
          <div className="font-medium">{testResult.success ? '✓ Connected' : '✗ Connection failed'}</div>
          <div className="text-[11px] mt-1">{testResult.message}</div>
          {testResult.latency_ms !== undefined && (
            <div className="text-[11px] mt-1">Latency: {testResult.latency_ms}ms</div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onTest(currentPayload)}
          disabled={testing}
          className="flex-1 bg-bmad-surface-raised hover:bg-bmad-border text-bmad-text py-2.5 rounded-button text-body font-medium transition-all border border-bmad-border"
          data-testid="test-connection-btn"
        >
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <button
          onClick={() => onSave(currentPayload)}
          disabled={loading || !modelName}
          className="flex-1 bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white py-2.5 rounded-button text-body font-medium transition-all shadow-bmad-sm"
          data-testid="save-settings-btn"
        >
          {loading ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
