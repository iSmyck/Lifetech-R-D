import { useCallback, useRef } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { Block, OutputType, AgentStep } from "../types";
import { submitQuerySync, QueryInput, QueryResponse } from "../services/api";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  localization: "Localization Agent",
  governance: "Governance Agent",
  performance: "Performance Agent",
  content_generation: "Content Generation Agent",
  validation: "Validation Agent",
};

export function useAgentBackend() {
  const { addBlock, updateAgentLogStep, completeAgentLog, toggleAgentLog } = useWorkspaceStore();
  const abortRef = useRef(false);

  const run = useCallback(
    async (content: string, outputType: OutputType | null) => {
      abortRef.current = false;

      // Read fresh state
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

      if (USE_MOCK) {
        // Fall back to local simulation
        runMockSimulation(content, outputType, threadId, addBlock, updateAgentLogStep, completeAgentLog, toggleAgentLog);
        return;
      }

      // 2. Create agent log block
      const logId = `log-${Date.now()}`;
      const initialSteps: AgentStep[] = [
        { id: "s-init", label: "Receiving query", status: "done" },
        { id: "s-classify", label: "Classifying intent", status: "running" },
      ];

      const logBlock: Block = {
        id: logId,
        threadId,
        createdAt: new Date().toISOString(),
        type: "agent-log",
        status: "running",
        steps: initialSteps,
      };
      addBlock(threadId, logBlock);
      setTimeout(() => toggleAgentLog(logId), 300);

      try {
        const input: QueryInput = {
          user_query: content,
          user_context: { market_focus: "Nigeria" },
          additional_parameters: {
            urgency: "medium",
            output_format_preference: "json",
            output_type: outputType ?? undefined,
            platform: outputType === "social" ? "Instagram" : "Email",
          },
        };

        const result = await submitQuerySync(input);
        if (abortRef.current) return;

        // Update log with actual executed agents
        updateLogWithResults(logId, threadId, result, updateAgentLogStep, completeAgentLog);

        // Add AI response block
        const responseBlock: Block = {
          id: `resp-${Date.now()}`,
          threadId,
          createdAt: new Date().toISOString(),
          type: "ai-response",
          content: result.final_response || "Analysis complete. See artifacts below for deliverables.",
        };
        addBlock(threadId, responseBlock);

        // Add artifact blocks from agent outputs
        addArtifactsFromResult(threadId, result, outputType, addBlock);
      } catch (err) {
        // Mark log as failed
        setTimeout(() => {
          completeAgentLog(logId);
          const errorBlock: Block = {
            id: `err-${Date.now()}`,
            threadId,
            createdAt: new Date().toISOString(),
            type: "ai-response",
            content: `**Error:** ${err instanceof Error ? err.message : "Failed to process request"}. Please try again or check your connection.`,
          };
          addBlock(threadId, errorBlock);
        }, 500);
      }
    },
    [addBlock, updateAgentLogStep, completeAgentLog, toggleAgentLog]
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { run, cancel };
}

function updateLogWithResults(
  logId: string,
  _threadId: string,
  result: QueryResponse,
  updateAgentLogStep: (blockId: string, stepId: string, status: AgentStep["status"]) => void,
  completeAgentLog: (blockId: string) => void
) {
  const agents = result.executed_agents || [];

  // Add steps for each executed agent
  agents.forEach((agent, idx) => {
    const stepId = `s-agent-${idx}`;
    const displayName = AGENT_DISPLAY_NAMES[agent.agent_name] || agent.agent_name;

    // We can't add new steps to existing log block easily with current store API,
    // so we just mark the final status. In a real implementation, we'd stream steps.
    // For now, the log block shows completion when done.
  });

  completeAgentLog(logId);
}

function addArtifactsFromResult(
  threadId: string,
  result: QueryResponse,
  outputType: OutputType | null,
  addBlock: (threadId: string, block: Block) => void
) {
  const outputs = result.agent_outputs || {};

  // Content generation artifact
  const content = (outputs.content as Record<string, unknown> | undefined)?.generated_content as
    | Record<string, unknown>
    | undefined;
  if (content) {
    const primary = content.primary_language_content as Record<string, string> | undefined;
    if (primary) {
      const artifactBlock: Block = {
        id: `art-content-${Date.now()}`,
        threadId,
        createdAt: new Date().toISOString(),
        type: "artifact",
        artifact: {
          id: `a-content-${Date.now()}`,
          type: outputType ?? "email",
          title: primary.headline || "Generated Content",
          content: `## ${primary.headline || ""}\n\n${primary.body || ""}\n\n**CTA:** ${primary.call_to_action || ""}`,
          version: 1,
          createdAt: new Date().toISOString(),
        },
      };
      addBlock(threadId, artifactBlock);
    }
  }

  // Localization report artifact
  const locReport = (outputs.localization as Record<string, unknown> | undefined)?.localization_report as
    | Record<string, unknown>
    | undefined;
  if (locReport) {
    const codes = (locReport.cultural_codes_applied as string[] | undefined)?.join(", ") || "";
    const lens = (locReport.generational_lens as string) || "";
    const artifactBlock: Block = {
      id: `art-loc-${Date.now()}`,
      threadId,
      createdAt: new Date().toISOString(),
      type: "artifact",
      artifact: {
        id: `a-loc-${Date.now()}`,
        type: "analysis",
        title: "Cultural Analysis Report",
        content: `### Cultural Codes Applied\n${codes}\n\n### Generational Lens\n${lens}`,
        version: 1,
        createdAt: new Date().toISOString(),
      },
    };
    addBlock(threadId, artifactBlock);
  }

  // Media strategy artifact
  const strategy = (outputs.performance as Record<string, unknown> | undefined)?.media_strategy as
    | Record<string, unknown>
    | undefined;
  if (strategy) {
    const channels = (strategy.recommended_channels as Array<Record<string, unknown>> | undefined) || [];
    const channelList = channels
      .map((c) => `- **${c.platform}**: ${c.rationale}`)
      .join("\n");
    const artifactBlock: Block = {
      id: `art-media-${Date.now()}`,
      threadId,
      createdAt: new Date().toISOString(),
      type: "artifact",
      artifact: {
        id: `a-media-${Date.now()}`,
        type: "analysis",
        title: "Media Strategy",
        content: `### Recommended Channels\n${channelList}`,
        version: 1,
        createdAt: new Date().toISOString(),
      },
    };
    addBlock(threadId, artifactBlock);
  }

  // If no artifacts were created from agent outputs, add a generic one
  if (!content && !locReport && !strategy) {
    const artifactBlock: Block = {
      id: `art-${Date.now()}`,
      threadId,
      createdAt: new Date().toISOString(),
      type: "artifact",
      artifact: {
        id: `a-${Date.now()}`,
        type: outputType ?? "email",
        title: "Generated Content",
        content: result.final_response || "No content generated.",
        version: 1,
        createdAt: new Date().toISOString(),
      },
    };
    addBlock(threadId, artifactBlock);
  }
}

// Local mock simulation fallback (same as old useAgentSimulation)
function runMockSimulation(
  content: string,
  outputType: OutputType | null,
  threadId: string,
  addBlock: (threadId: string, block: Block) => void,
  updateAgentLogStep: (blockId: string, stepId: string, status: AgentStep["status"]) => void,
  completeAgentLog: (blockId: string) => void,
  toggleAgentLog: (blockId: string) => void
) {
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
  setTimeout(() => toggleAgentLog(logId), 300);

  let stepIndex = 0;
  const runStep = () => {
    if (stepIndex >= steps.length) {
      completeAgentLog(logId);
      const responseBlock: Block = {
        id: `resp-${Date.now()}`,
        threadId,
        createdAt: new Date().toISOString(),
        type: "ai-response",
        content: `I have processed your request for a **${outputType ?? "custom"}** output. Based on the context provided, I have structured the deliverable to match your brand voice and target audience. Review the artifact below and let me know if you would like any refinements.`,
      };
      addBlock(threadId, responseBlock);

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
}
