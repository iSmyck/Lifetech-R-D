import { useEffect } from "react";
import { Block } from "../../types";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { UserPromptBlock } from "../blocks/UserPromptBlock";
import { AgentLogBlock } from "../blocks/AgentLogBlock";
import { AIResponseBlock } from "../blocks/AIResponseBlock";
import { ArtifactBlock } from "../blocks/ArtifactBlock";
import { DiffBlock } from "../blocks/DiffBlock";
import { ActionBlock } from "../blocks/ActionBlock";

interface BlockRendererProps {
  block: Block;
  index: number;
}

export function BlockRenderer({ block, index }: BlockRendererProps) {
  const { toggleAgentLog } = useWorkspaceStore();
  const delay = Math.min(index * 40, 200);

  // Auto-expand agent logs on first view if running
  useEffect(() => {
    if (block.type === "agent-log" && (block as Extract<Block, { type: "agent-log" }>).status === "running") {
      const timer = setTimeout(() => {
        toggleAgentLog(block.id);
      }, 600 + delay);
      return () => clearTimeout(timer);
    }
  }, [block, delay, toggleAgentLog]);

  switch (block.type) {
    case "user-prompt":
      return <UserPromptBlock block={block} delay={delay} />;
    case "agent-log":
      return <AgentLogBlock block={block} delay={delay} />;
    case "ai-response":
      return <AIResponseBlock block={block} delay={delay} />;
    case "artifact":
      return <ArtifactBlock block={block} delay={delay} />;
    case "diff":
      return <DiffBlock block={block} delay={delay} />;
    case "action":
      return <ActionBlock block={block} delay={delay} />;
    default:
      return null;
  }
}
