import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentLogBlock as AgentLogBlockType } from "../../types";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { ChevronDown, ChevronUp, Check, Circle, X } from "lucide-react";

interface Props {
  block: AgentLogBlockType;
  delay: number;
}

function StepIcon({ status }: { status: string }) {
  if (status === "done") return <Check className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === "error") return <X className="w-3.5 h-3.5 text-red-500" />;
  if (status === "running") return <div className="agent-spinner" />;
  return <Circle className="w-3.5 h-3.5 text-stone-300" />;
}

export function AgentLogBlock({ block, delay }: Props) {
  const { agentLogExpanded, toggleAgentLog } = useWorkspaceStore();
  const isExpanded = agentLogExpanded[block.id] ?? false;
  const [showPulse, setShowPulse] = useState(block.status === "running");

  useEffect(() => {
    if (block.status === "running") {
      const timer = setTimeout(() => setShowPulse(true), delay);
      return () => clearTimeout(timer);
    }
  }, [block.status, delay]);

  const runningStep = block.steps.find((s) => s.status === "running");
  const currentLabel = runningStep?.label ?? block.steps[block.steps.length - 1]?.label ?? "";

  return (
    <div
      className="block-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="rounded-xl bg-agent-log-bg border border-stone-100/60 overflow-hidden">
        {/* Collapsed row */}
        <button
          onClick={() => toggleAgentLog(block.id)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-100/50 transition-colors"
        >
          {block.status === "running" && showPulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
          )}
          {block.status === "completed" && (
            <Check className="w-4 h-4 text-emerald-500" />
          )}
          {block.status === "error" && (
            <X className="w-4 h-4 text-red-500" />
          )}
          <span className="flex-1 text-sm text-text-secondary">
            {block.status === "running" ? currentLabel : "Agent finished"}
          </span>
          <span className="text-xs text-text-tertiary">
            {block.steps.filter((s) => s.status === "done").length}/{block.steps.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          )}
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 space-y-2">
                {block.steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <StepIcon status={step.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${step.status === "pending" ? "text-text-tertiary" : "text-text-secondary"}`}>
                          {step.label}
                        </span>
                        {step.timestamp && (
                          <span className="text-[11px] text-text-tertiary font-mono">{step.timestamp}</span>
                        )}
                      </div>
                      {step.detail && (
                        <p className="text-xs text-text-tertiary mt-0.5">{step.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
