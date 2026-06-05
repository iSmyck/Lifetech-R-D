import { useState, useRef, useEffect } from "react";
import { useAgentBackend } from "../../hooks/useAgentBackend";
import { OUTPUT_TYPES } from "../../lib/constants";
import { Paperclip, Link, FileText, Users, Palette, Send, ChevronDown, X } from "lucide-react";

const attachmentOptions = [
  { id: "brief", label: "Brief", icon: FileText },
  { id: "link", label: "Link", icon: Link },
  { id: "file", label: "File", icon: Paperclip },
  { id: "audience", label: "Audience", icon: Users },
  { id: "brand", label: "Brand Voice", icon: Palette },
];

export function InputBar() {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showOutputType, setShowOutputType] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<"email" | "social" | "landing" | "analysis" | "calendar" | "ad" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  const { run } = useAgentBackend();

  const handleSend = () => {
    if (!value.trim()) return;
    run(value, selectedOutput).catch(() => {});
    setValue("");
    setSelectedOutput(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-stone-100 bg-surface px-4 py-3">
      <div
        className={`max-w-3xl mx-auto rounded-xl border transition-all ${
          isFocused ? "border-stone-300 shadow-sm" : "border-stone-200"
        } bg-white`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your agent or describe what you need..."
          rows={1}
          className="w-full px-4 pt-3 pb-2 text-[15px] text-text-primary placeholder:text-text-tertiary bg-transparent outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between px-3 pb-2">
          {/* Left: Attachments */}
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className="p-1.5 rounded-md hover:bg-stone-100 text-text-tertiary transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {showAttachments && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAttachments(false)} />
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-stone-100 py-1 z-20 min-w-[160px]">
                  {attachmentOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-stone-50 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-text-tertiary" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right: Output type + Send */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowOutputType(!showOutputType)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedOutput
                    ? "bg-accent-sky-bg text-accent-sky-text"
                    : "text-text-tertiary hover:bg-stone-100"
                }`}
              >
                {selectedOutput ? OUTPUT_TYPES.find((o) => o.id === selectedOutput)?.label : "Output Type"}
                <ChevronDown className="w-3.5 h-3.5" />
                {selectedOutput && (
                  <X
                    className="w-3 h-3 ml-0.5 hover:text-text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOutput(null);
                    }}
                  />
                )}
              </button>

              {showOutputType && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOutputType(false)} />
                  <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-stone-100 py-1 z-20 min-w-[180px]">
                    {OUTPUT_TYPES.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSelectedOutput(opt.id);
                          setShowOutputType(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors ${
                          selectedOutput === opt.id ? "text-accent-sky-text font-medium" : "text-text-secondary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!value.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-text-primary text-white text-xs font-medium hover:bg-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
