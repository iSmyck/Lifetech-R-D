import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

interface Props {
  artifactId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
}

export function InlineArtifactChat({ artifactId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "c-1",
      role: "agent",
      content: "I'm scoped to this artifact. Ask me to revise, expand, or refine anything.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate agent response
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "agent",
        content: "I've noted your feedback. A diff will appear in the main canvas showing the proposed changes.",
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone-100">
        <h3 className="text-sm font-semibold text-text-primary">Artifact Chat</h3>
        <p className="text-xs text-text-tertiary mt-0.5">Refine this artifact inline</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "user" ? "bg-accent-lavender-bg" : "bg-accent-sky-bg"
            }`}>
              {msg.role === "user" ? (
                <User className="w-3 h-3 text-accent-lavender-text" />
              ) : (
                <Bot className="w-3 h-3 text-accent-sky-text" />
              )}
            </div>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-accent-lavender-bg text-accent-lavender-text"
                : "bg-stone-50 text-text-secondary"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Make it punchier..."
            className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-xs text-text-primary placeholder:text-text-tertiary bg-white outline-none focus:border-stone-300 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-text-primary text-white hover:bg-text-secondary disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
