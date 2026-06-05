import { useCallback } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { Block, OutputType, AgentStep } from "../types";

export function useAgentSimulation() {
  const { addBlock, updateAgentLogStep, completeAgentLog, toggleAgentLog } = useWorkspaceStore();

  const simulate = useCallback(
    (content: string, outputType: OutputType | null) => {
      // Read fresh state to avoid stale closure after createThread
      const state = useWorkspaceStore.getState();
      const threadId = state.activeThreadId;
      if (!threadId) return;

      // 1. Add user prompt block
      const userBlock: Block = {
        id: `b-${Date.now()}`,
        threadId,
        createdAt: new Date().toISOString(),
        type: "user-prompt",
        content,
        attachments: [],
        outputType,
      };
      addBlock(threadId, userBlock);

      // 2. Add agent log block
      const logId = `log-${Date.now()}`;
      const steps: AgentStep[] = [
        { id: "s1", label: "Analyzing request context", status: "pending" },
        { id: "s2", label: "Retrieving relevant knowledge", status: "pending" },
        { id: "s3", label: outputType === "email" ? "Drafting email sequence" : "Generating content", status: "pending" },
        { id: "s4", label: "Applying brand voice guidelines", status: "pending" },
        { id: "s5", label: "Finalizing output", status: "pending" },
      ];

      const logBlock: Block = {
        id: logId,
        threadId,
        createdAt: new Date().toISOString(),
        type: "agent-log",
        status: "running",
        steps,
      };
      addBlock(threadId, logBlock);

      // Auto-expand the log
      setTimeout(() => toggleAgentLog(logId), 300);

      // Simulate steps progressing
      let stepIndex = 0;
      const runStep = () => {
        if (stepIndex >= steps.length) {
          completeAgentLog(logId);
          // Add AI response
          const responseBlock: Block = {
            id: `resp-${Date.now()}`,
            threadId,
            createdAt: new Date().toISOString(),
            type: "ai-response",
            content: `I have processed your request for a **${outputType ?? "custom"}** output. Based on the context provided, I have structured the deliverable to match your brand voice and target audience. Review the artifact below and let me know if you would like any refinements.`,
          };
          addBlock(threadId, responseBlock);

          // Add artifact
          const artifactBlock: Block = {
            id: `art-${Date.now()}`,
            threadId,
            createdAt: new Date().toISOString(),
            type: "artifact",
            artifact: {
              id: `a-${Date.now()}`,
              type: outputType ?? "email",
              title: outputType === "email" ? "Generated Email Sequence" : outputType === "social" ? "Social Content Pack" : "Generated Content",
              content: "# Generated Content\n\nThis is a placeholder for the generated content. In a real implementation, this would contain the full deliverable created by the agent based on your prompt and context.",
              version: 1,
              createdAt: new Date().toISOString(),
            },
          };
          addBlock(threadId, artifactBlock);
          return;
        }

        const step = steps[stepIndex];
        updateAgentLogStep(logId, step.id, "running");

        setTimeout(() => {
          updateAgentLogStep(logId, step.id, "done");
          stepIndex++;
          setTimeout(runStep, 800 + Math.random() * 600);
        }, 600 + Math.random() * 400);
      };

      setTimeout(runStep, 400);
    },
    [addBlock, updateAgentLogStep, completeAgentLog, toggleAgentLog]
  );

  return { simulate };
}
