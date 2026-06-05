import type { LLMConfig } from '../hooks/useLLMConfig';

interface ModelIndicatorProps {
  config: LLMConfig | null;
  onClick: () => void;
}

export default function ModelIndicator({ config, onClick }: ModelIndicatorProps) {
  if (!config || !config.model_name) return null;

  const displayName = config.model_name.split('/').pop() || config.model_name;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[11px] text-bmad-muted hover:text-bmad-text bg-bmad-surface-raised hover:bg-bmad-border px-2 py-1 rounded-button border border-bmad-border transition-all"
      title="Click to configure AI model"
      data-testid="model-indicator"
    >
      <span>🧠</span>
      <span className="font-medium hidden sm:inline">{displayName}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
    </button>
  );
}
