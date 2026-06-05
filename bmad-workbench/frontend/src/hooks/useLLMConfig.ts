import { useState, useEffect, useCallback } from 'react';

export interface LLMConfig {
  id?: string;
  provider: string;
  model_name: string;
  base_url?: string | null;
  api_key?: string | null;
  is_active?: boolean;
}

export interface ProviderInfo {
  id: string;
  name: string;
  fields: string[];
  default_base_url?: string;
  default_models: string[];
}

export interface TestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
  model_info?: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function useLLMConfig() {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setError(null);
      const resp = await fetch(`${API_BASE}/api/settings/llm`);
      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch config (${resp.status}): ${text}`);
      }
      const data = await resp.json();
      setConfig(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch LLM config';
      console.warn(msg, err);
      setError(msg);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/settings/llm/providers`);
      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch providers (${resp.status}): ${text}`);
      }
      const data = await resp.json();
      setProviders(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch providers';
      console.warn(msg, err);
      setError(msg);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchProviders();
  }, [fetchConfig, fetchProviders]);

  const saveConfig = useCallback(async (payload: LLMConfig) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/api/settings/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Unknown error');
        throw new Error(`Failed to save config (${resp.status}): ${text}`);
      }
      const data = await resp.json();
      setConfig(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save LLM config';
      console.warn(msg, err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (payload: LLMConfig) => {
    setTesting(true);
    setTestResult(null);
    try {
      const resp = await fetch(`${API_BASE}/api/settings/llm/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Connection failed');
        setTestResult({ success: false, message: `HTTP ${resp.status}: ${text}` });
        return null;
      }
      const data = await resp.json();
      setTestResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.warn('Failed to test connection:', err);
      setTestResult({ success: false, message: msg });
      return null;
    } finally {
      setTesting(false);
    }
  }, []);

  return {
    config,
    providers,
    loading,
    testing,
    testResult,
    error,
    fetchConfig,
    saveConfig,
    testConnection,
  };
}
