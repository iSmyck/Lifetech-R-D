import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useAgentBackend } from "../../hooks/useAgentBackend";
import { Send, Sparkles, Mail, Share2, FileText, BarChart3 } from "lucide-react";

const suggestions = [
  { icon: Mail, label: "Email campaign", prompt: "Write a 3-email nurture sequence for onboarding" },
  { icon: Share2, label: "Social content", prompt: "Create a week of LinkedIn posts about product launches" },
  { icon: BarChart3, label: "Competitive analysis", prompt: "Analyze our top 3 competitors positioning" },
  { icon: FileText, label: "Landing page", prompt: "Write landing page copy for our new feature" },
];

export function LandingPage() {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setMode, createThread } = useWorkspaceStore();
  const { run } = useAgentBackend();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  const handleSend = (promptText?: string) => {
    const content = promptText ?? value;
    if (!content.trim()) return;

    createThread(content.slice(0, 60), content.slice(0, 120));
    setMode("workspace");
    run(content, null).catch(() => {});
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 bg-canvas">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-sky-bg text-accent-sky-text text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI-native marketing workspace
          </div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight mb-3">
            What are we building today?
          </h1>
          <p className="text-[15px] text-text-secondary leading-relaxed max-w-md mx-auto">
            Launch campaigns, write content, analyze competitors — with agents that think and work alongside you.
          </p>
        </div>

        {/* Input */}
        <div
          className={`rounded-xl border bg-white transition-all ${
            isFocused ? "border-stone-300 shadow-sm" : "border-stone-200"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your campaign, content, or strategy..."
            rows={1}
            className="w-full px-5 pt-4 pb-2 text-[16px] text-text-primary placeholder:text-text-tertiary bg-transparent outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md hover:bg-stone-100 text-text-tertiary transition-colors">
                <FileText className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!value.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-text-primary text-white text-sm font-medium hover:bg-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Run
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                onClick={() => handleSend(s.prompt)}
                className="flex items-start gap-3 p-4 rounded-xl border border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-text-secondary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{s.label}</div>
                  <div className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{s.prompt}</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-text-tertiary">
            Or pick up where you left off — your projects and threads are saved.
          </p>
          <button
            onClick={() => setMode("workspace")}
            className="mt-2 text-xs font-medium text-accent-sky-text hover:underline"
          >
            Go to workspace
          </button>
        </div>
      </motion.div>
    </div>
  );
}
