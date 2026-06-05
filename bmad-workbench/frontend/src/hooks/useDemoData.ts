import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { StreamCard } from '../types';

const DEMO_DOCUMENT_ID = '550e8400-e29b-41d4-a716-446655440000';

const DEMO_PRD_TEXT = `# API Gateway PRD — Customer Authentication Service

## Executive Summary

We need a unified API Gateway to handle authentication, rate limiting, and request routing for all microservices. This gateway will sit between our mobile apps, web clients, and the backend services, providing a single entry point with consistent security policies.

## Goals

- **Centralized Authentication**: All service-to-service and client-to-service calls authenticate through the gateway
- **Rate Limiting**: Prevent abuse with tiered rate limits (100 req/min for free tier, 10,000 req/min for enterprise)
- **Request Routing**: Route requests to appropriate microservices based on path and headers
- **Observability**: Unified logging, metrics, and distributed tracing for all API calls
- **Protocol Translation**: Support both REST and gRPC backends from a single GraphQL/REST frontend

## Non-Goals

- This PRD does **not** cover the internal redesign of individual microservices
- We will not build a custom identity provider; we integrate with existing OAuth2/OIDC providers
- Multi-region active-active deployment is Phase 2

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Support OAuth2, OIDC, and API key authentication | P0 |
| FR-2 | JWT token validation with configurable issuers | P0 |
| FR-3 | Per-client rate limiting with burst allowance | P0 |
| FR-4 | Path-based routing with wildcard support | P0 |
| FR-5 | Request/response transformation (headers, body) | P1 |
| FR-6 | GraphQL federation across multiple subgraphs | P1 |
| FR-7 | WebSocket proxying for real-time services | P2 |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | P99 latency (auth + routing) | < 10ms |
| NFR-2 | Throughput | 50,000 req/sec |
| NFR-3 | Availability | 99.99% |
| NFR-4 | Token validation cache hit rate | > 95% |
| NFR-5 | Zero-downtime config reload | Required |

## Acceptance Criteria

- [ ] A request with a valid JWT token is authenticated and routed within 10ms (P99)
- [ ] A request exceeding rate limits receives HTTP 429 with Retry-After header
- [ ] Invalid or expired tokens receive HTTP 401 with clear error message
- [ ] Configuration changes (new routes, rate limits) apply without restart within 5 seconds
- [ ] All requests emit structured logs with trace_id, user_id, latency, and status
- [ ] Load test demonstrates 50,000 req/sec sustained for 10 minutes

## Stakeholders

| Name | Role | RACI |
|------|------|------|
| Sarah Chen | Engineering Lead | Accountable |
| Marcus Johnson | Backend Architect | Responsible |
| Priya Patel | Security Engineer | Consulted |
| David Kim | DevOps Lead | Consulted |
| Product Team | End Users | Informed |

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Core Auth + Routing | 4 weeks | MVP with OAuth2 + basic routing |
| Phase 2: Rate Limiting + Caching | 3 weeks | Redis-backed rate limits, JWT cache |
| Phase 3: GraphQL + Observability | 3 weeks | GraphQL federation, unified logging |
| Phase 4: Load Testing + Hardening | 2 weeks | Performance validation, security audit |
| **Total** | **12 weeks** | Production-ready gateway |

## Open Questions

1. Should we support mTLS for service-to-service authentication in addition to JWT?
2. What's the migration plan for the 3 existing API proxies we currently maintain?
3. Do we need request body inspection for WAF-style protection?
`;

const DEMO_INTENT = 'Draft a PRD for our new API Gateway that handles authentication, rate limiting, and routing for all microservices. Include timeline, stakeholders, and acceptance criteria.';

export function useDemoData() {
  const {
    activeThreadId,
    appendStreamCard,
    setGenerating,
    setReasoningText,
    setBmadPhases,
  } = useAppStore();

  const loadDemo = useCallback(() => {
    if (!activeThreadId) {
      console.warn('No active thread selected');
      return;
    }

    // Clear existing cards first
    useAppStore.setState({ streamCards: [] });

    const now = Date.now();
    const threadId = activeThreadId;

    // Set phases
    setBmadPhases([
      { id: 'discovery', label: 'Discovery', description: 'Gather requirements', status: 'completed' },
      { id: 'planning', label: 'Planning', description: 'Structure the PRD', status: 'completed' },
      { id: 'drafting', label: 'Drafting', description: 'Generate draft', status: 'completed' },
      { id: 'review', label: 'Review', description: 'Human review', status: 'current' },
    ]);

    const cards: StreamCard[] = [
      // User intent
      {
        id: `card-${now}`,
        thread_id: threadId,
        card_type: 'user_intent',
        sequence_number: now,
        content: { text: DEMO_INTENT },
        created_at: new Date().toISOString(),
      },
      // Reasoning tokens
      {
        id: `card-${now + 1}`,
        thread_id: threadId,
        card_type: 'ai_reasoning',
        sequence_number: now + 1,
        content: {
          text: 'Analyzing intent and cross-referencing requirements…',
          phase: 'discovery',
          agent_name: 'Saga (Analyst)',
        },
        created_at: new Date(now + 1000).toISOString(),
      },
      {
        id: `card-${now + 2}`,
        thread_id: threadId,
        card_type: 'ai_reasoning',
        sequence_number: now + 2,
        content: {
          text: 'Checking project context and existing documents…',
          phase: 'planning',
          agent_name: 'Winston (Architect)',
        },
        created_at: new Date(now + 2000).toISOString(),
      },
      {
        id: `card-${now + 3}`,
        thread_id: threadId,
        card_type: 'ai_reasoning',
        sequence_number: now + 3,
        content: {
          text: 'Synthesizing stakeholder list and timeline constraints…',
          phase: 'planning',
          agent_name: 'John (Product Manager)',
        },
        created_at: new Date(now + 3000).toISOString(),
      },
      {
        id: `card-${now + 4}`,
        thread_id: threadId,
        card_type: 'ai_reasoning',
        sequence_number: now + 4,
        content: {
          text: 'Drafting document structure and acceptance criteria…',
          phase: 'drafting',
          agent_name: 'Amelia (Developer)',
        },
        created_at: new Date(now + 4000).toISOString(),
      },
      // Draft
      {
        id: `card-${now + 5}`,
        thread_id: threadId,
        card_type: 'draft',
        sequence_number: now + 5,
        content: {
          text: DEMO_PRD_TEXT,
          document_id: DEMO_DOCUMENT_ID,
          title: 'API Gateway PRD — Customer Authentication Service',
          phase: 'drafting',
          agent_name: 'Amelia (Developer)',
        },
        created_at: new Date(now + 5000).toISOString(),
      },
    ];

    // Add cards with small delays for animation effect
    cards.forEach((card, index) => {
      setTimeout(() => {
        appendStreamCard(card);
      }, index * 150);
    });

    // Simulate generating state briefly
    setGenerating(true);
    setReasoningText('Draft ready for review');
    setTimeout(() => {
      setGenerating(false);
      setReasoningText('');
    }, cards.length * 150 + 500);
  }, [activeThreadId, appendStreamCard, setGenerating, setReasoningText, setBmadPhases]);

  return { loadDemo };
}
