import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { StreamCard } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

interface StreamEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
}

function parseSseEvent(raw: string): StreamEvent | null {
  const lines = raw.split('\n');
  let id = '';
  let event = 'message';
  let data = '';
  for (const line of lines) {
    if (line.startsWith('id: ')) id = line.slice(4);
    else if (line.startsWith('event: ')) event = line.slice(7);
    else if (line.startsWith('data: ')) data = line.slice(6);
  }
  if (!data) return null;
  try {
    return { id, event, data: JSON.parse(data) };
  } catch {
    return { id, event, data: { text: data } };
  }
}

export function useThreadStream(threadId: string | null) {
  const {
    appendStreamCard,
    setGenerating,
    setReasoningText,
    setBmadPhases,
  } = useAppStore();

  const esRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string>('');
  const reconnectDelayRef = useRef<number>(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!threadId || !isMountedRef.current) return;
    if (typeof EventSource === 'undefined') return;

    const url = new URL(`${API_BASE}/api/threads/${threadId}/stream`, window.location.href);
    url.searchParams.set('idle_timeout', '30');

    if (lastEventIdRef.current) {
      // Note: EventSource does not support custom headers like Last-Event-ID
      // on initial connect; the browser handles it automatically if we reconnect.
      // For explicit reconnects we rely on query params or browser behavior.
      // Here we append as query param for our custom reconnect logic.
      url.searchParams.set('last_event_id', lastEventIdRef.current);
    }
    // Re-create with potential last_event_id query param
    const finalEs = new EventSource(url.toString());

    finalEs.onopen = () => {
      reconnectDelayRef.current = 1000;
    };

    finalEs.onmessage = (e) => {
      const parsed = parseSseEvent(`id: ${e.lastEventId || ''}\nevent: message\ndata: ${e.data}`);
      if (!parsed) return;
      handleEvent(parsed);
    };

    // Listen for specific event types
    const eventTypes = ['reasoning_token', 'checkpoint_pause', 'draft_complete', 'approval_recorded', 'human_input', 'phase_start', 'phase_end'];
    for (const type of eventTypes) {
      finalEs.addEventListener(type, (e: MessageEvent) => {
        const parsed = parseSseEvent(`id: ${e.lastEventId || ''}\nevent: ${type}\ndata: ${e.data}`);
        if (!parsed) return;
        handleEvent(parsed);
      });
    }

    finalEs.onerror = () => {
      finalEs.close();
      if (!isMountedRef.current) return;
      // Exponential backoff
      const delay = Math.min(reconnectDelayRef.current, 30000);
      reconnectDelayRef.current *= 2;
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    esRef.current = finalEs;
  }, [threadId]);

  const handleEvent = useCallback((event: StreamEvent) => {
    if (event.id) {
      lastEventIdRef.current = event.id;
    }

    switch (event.event) {
      case 'reasoning_token': {
        setGenerating(true);
        setReasoningText(String(event.data.text || 'Thinking…'));
        break;
      }
      case 'checkpoint_pause': {
        setGenerating(true);
        setReasoningText('Awaiting your input…');
        const checkpointCard: StreamCard = {
          id: `card-${Date.now()}`,
          thread_id: threadId || '',
          card_type: 'checkpoint_clarification',
          sequence_number: Date.now(),
          content: event.data,
          created_at: new Date().toISOString(),
        };
        appendStreamCard(checkpointCard);
        break;
      }
      case 'human_input': {
        setGenerating(true);
        setReasoningText('Resuming analysis…');
        const checkpointId = String(event.data.checkpoint_id || '');
        const responseText = String(event.data.response || '');
        // If this is a checkpoint response, create a checkpoint_response card
        if (checkpointId) {
          const responseCard: StreamCard = {
            id: `card-${Date.now()}`,
            thread_id: threadId || '',
            card_type: 'checkpoint_response',
            sequence_number: Date.now(),
            content: {
              checkpoint_id: checkpointId,
              response: responseText,
              question: String(event.data.question || ''),
            },
            created_at: new Date().toISOString(),
          };
          appendStreamCard(responseCard);
        } else {
          const userResponseCard: StreamCard = {
            id: `card-${Date.now()}`,
            thread_id: threadId || '',
            card_type: 'user_intent',
            sequence_number: Date.now(),
            content: { text: responseText },
            created_at: new Date().toISOString(),
          };
          appendStreamCard(userResponseCard);
        }
        break;
      }
      case 'draft_complete': {
        setGenerating(false);
        setReasoningText('Draft ready for review');
        const draftCard: StreamCard = {
          id: `card-${Date.now()}`,
          thread_id: threadId || '',
          card_type: 'draft',
          sequence_number: Date.now(),
          content: event.data,
          created_at: new Date().toISOString(),
        };
        appendStreamCard(draftCard);
        // Fade out after 5s
        setTimeout(() => {
          setReasoningText('');
        }, 5000);
        break;
      }
      case 'approval_recorded': {
        const approvalCard: StreamCard = {
          id: `card-${Date.now()}`,
          thread_id: threadId || '',
          card_type: 'approval',
          sequence_number: Date.now(),
          content: event.data,
          created_at: new Date().toISOString(),
        };
        appendStreamCard(approvalCard);
        break;
      }
      case 'phase_start': {
        setGenerating(true);
        const label = event.data.label as string;
        const agentName = event.data.agent_name as string;
        setReasoningText(`${agentName} is starting ${label}…`);
        // Update phases state
        const phases = (event.data.phases as Array<{ id: string; label: string; status: string }> || []).map((p) => ({
          id: p.id,
          label: p.label,
          description: `${p.label} phase`,
          status: p.status as 'completed' | 'current' | 'pending',
        }));
        if (phases.length > 0) {
          setBmadPhases(phases);
        }
        break;
      }
      case 'phase_end': {
        setGenerating(false);
        setReasoningText('');
        break;
      }
      default:
        break;
    }
  }, [threadId, appendStreamCard, setGenerating, setReasoningText]);

  useEffect(() => {
    isMountedRef.current = true;
    lastEventIdRef.current = '';
    reconnectDelayRef.current = 1000;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, [connect]);
}
