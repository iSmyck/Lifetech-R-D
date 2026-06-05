import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for consuming agent state via Server-Sent Events (SSE).
 *
 * @param endpoint - SSE endpoint URL.
 * @returns Agent state, connection status, and control functions.
 */
export function useAgentStream(endpoint: string) {
  const [state, setState] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);

  // TODO: Implement EventSource logic, parsing, cleanup

  return { state, connected };
}
