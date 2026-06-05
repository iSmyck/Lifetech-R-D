/**
 * API client for communicating with the EGM AI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface QueryInput {
  user_query: string;
  query_id?: string;
  user_context?: {
    user_id?: string;
    language_preference?: string;
    market_focus?: string;
  };
  additional_parameters?: {
    urgency?: "high" | "medium" | "low";
    output_format_preference?: "markdown" | "json" | "text";
    marketing_objective?: string;
    platform?: string;
    output_type?: string;
  };
}

export interface QueryResponse {
  query_id: string;
  status: string;
  final_response: string;
  response_summary: string;
  executed_agents: Array<{
    agent_name: string;
    status: string;
    output_summary: string;
  }>;
  review_status: string;
  processing_time_ms: number;
  timestamp: string;
  agent_outputs?: Record<string, unknown>;
  validation_result?: Record<string, unknown>;
}

export async function submitQuerySync(input: QueryInput): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/query/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function submitQueryAsync(input: QueryInput): Promise<{ query_id: string; status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function getQueryStatus(queryId: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/query/${queryId}/status`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export function createSSEStream(queryId: string): EventSource {
  return new EventSource(`${API_BASE_URL}/api/v1/query/stream/${queryId}`);
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("Backend health check failed");
  return res.json();
}
