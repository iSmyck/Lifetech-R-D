-- =============================================================================
-- BA/SA AI Assistant — Database Schema + Seed Data
-- =============================================================================
-- Run this against your PostgreSQL instance (with pgvector extension enabled)
-- =============================================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 1. Document Templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'requirements', 'system_design', 'api_spec'
    description TEXT,
    template_content TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert document templates
INSERT INTO document_templates (name, type, description, template_content, sections) VALUES
(
    'Software Requirements Specification (SRS)',
    'requirements',
    'Standard IEEE 830 style requirements document for software projects',
    E'# {{title}}\n\n## 1. Introduction\n### 1.1 Purpose\n{{purpose}}\n\n### 1.2 Scope\n{{scope}}\n\n### 1.3 Definitions, Acronyms, and Abbreviations\n{{definitions}}\n\n### 1.4 References\n{{references}}\n\n### 1.5 Overview\n{{overview}}\n\n## 2. Overall Description\n### 2.1 Product Perspective\n{{product_perspective}}\n\n### 2.2 Product Functions\n{{product_functions}}\n\n### 2.3 User Classes and Characteristics\n{{user_classes}}\n\n### 2.4 Operating Environment\n{{operating_environment}}\n\n### 2.5 Design and Implementation Constraints\n{{constraints}}\n\n### 2.6 User Documentation\n{{user_documentation}}\n\n### 2.7 Assumptions and Dependencies\n{{assumptions}}\n\n## 3. System Features\n{{system_features}}\n\n## 4. External Interface Requirements\n### 4.1 User Interfaces\n{{user_interfaces}}\n\n### 4.2 Hardware Interfaces\n{{hardware_interfaces}}\n\n### 4.3 Software Interfaces\n{{software_interfaces}}\n\n### 4.4 Communications Interfaces\n{{communications_interfaces}}\n\n## 5. Non-Functional Requirements\n### 5.1 Performance Requirements\n{{performance_requirements}}\n\n### 5.2 Safety Requirements\n{{safety_requirements}}\n\n### 5.3 Security Requirements\n{{security_requirements}}\n\n### 5.4 Software Quality Attributes\n{{quality_attributes}}\n\n## 6. Appendices\n{{appendices}}',
    '["1. Introduction", "2. Overall Description", "3. System Features", "4. External Interface Requirements", "5. Non-Functional Requirements", "6. Appendices"]'::jsonb
),
(
    'System Design Document (SDD)',
    'system_design',
    'High-level and detailed system design document with architecture diagrams',
    E'# {{title}}\n\n## 1. Introduction\n### 1.1 Purpose\n{{purpose}}\n\n### 1.2 Scope\n{{scope}}\n\n### 1.3 Definitions\n{{definitions}}\n\n## 2. System Overview\n{{system_overview}}\n\n## 3. Design Considerations\n### 3.1 Assumptions and Dependencies\n{{assumptions}}\n\n### 3.2 Constraints\n{{constraints}}\n\n### 3.3 Risks and Mitigation\n{{risks}}\n\n## 4. System Architecture\n### 4.1 High-Level Architecture\n{{high_level_architecture}}\n\n```mermaid\n{{architecture_diagram}}\n```\n\n### 4.2 Component Diagram\n{{component_description}}\n\n```mermaid\n{{component_diagram}}\n```\n\n### 4.3 Data Flow\n{{data_flow_description}}\n\n```mermaid\n{{data_flow_diagram}}\n```\n\n## 5. Detailed Design\n### 5.1 Module Descriptions\n{{module_descriptions}}\n\n### 5.2 Database Design\n{{database_design}}\n\n```mermaid\n{{er_diagram}}\n```\n\n### 5.3 API Design\n{{api_design}}\n\n### 5.4 Class Diagrams\n{{class_descriptions}}\n\n```mermaid\n{{class_diagram}}\n```\n\n## 6. Interface Design\n### 6.1 User Interface\n{{ui_design}}\n\n### 6.2 External System Interfaces\n{{external_interfaces}}\n\n## 7. Deployment Architecture\n{{deployment_architecture}}\n\n```mermaid\n{{deployment_diagram}}\n```\n\n## 8. Appendices\n{{appendices}}',
    '["1. Introduction", "2. System Overview", "3. Design Considerations", "4. System Architecture", "5. Detailed Design", "6. Interface Design", "7. Deployment Architecture", "8. Appendices"]'::jsonb
),
(
    'API Specification Document',
    'api_spec',
    'RESTful API specification with endpoints, request/response schemas, and examples',
    E'# {{title}}\n\n## 1. Overview\n{{overview}}\n\n## 2. Authentication\n{{authentication}}\n\n## 3. Base URL\n{{base_url}}\n\n## 4. Common Headers\n{{common_headers}}\n\n## 5. Error Handling\n{{error_handling}}\n\n## 6. Endpoints\n{{endpoints}}\n\n## 7. Data Models\n{{data_models}}\n\n## 8. Rate Limiting\n{{rate_limiting}}\n\n## 9. Changelog\n{{changelog}}',
    '["1. Overview", "2. Authentication", "3. Base URL", "4. Common Headers", "5. Error Handling", "6. Endpoints", "7. Data Models", "8. Rate Limiting", "9. Changelog"]'::jsonb
);

-- =============================================================================
-- 2. Document Drafts (before HITL approval)
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_drafts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    title VARCHAR(255),
    template_type VARCHAR(50),
    content TEXT,
    diagrams JSONB DEFAULT '[]',
    sources JSONB DEFAULT '{}', -- { jira_tickets: [], meeting_notes: [], rag_chunks: [] }
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending_review, approved, rejected, editing
    reviewer_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 3. Knowledge Base Documents (after HITL approval)
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base_docs (
    id SERIAL PRIMARY KEY,
    draft_id INTEGER REFERENCES document_drafts(id),
    wiki_js_page_id VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    published_at TIMESTAMP DEFAULT NOW(),
    published_by VARCHAR(100)
);

-- =============================================================================
-- 4. RAG Knowledge Base (pgvector)
-- =============================================================================

CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    source VARCHAR(100),
    category VARCHAR(100), -- 'api_doc', 'architecture', 'business_rule', 'user_guide'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_embedding ON rag_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_rag_category ON rag_documents(category);
CREATE INDEX IF NOT EXISTS idx_rag_source ON rag_documents(source);

-- =============================================================================
-- 5. BA/SA Assistant Sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS ba_sa_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(100),
    mode VARCHAR(50), -- 'rag_chat', 'doc_creation'
    context JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA: Mock RAG Documents
-- =============================================================================

-- Note: For real embeddings, you would generate these via an embedding model.
-- For mock data, we insert NULL embeddings and use text search for demos.
-- In production, populate embeddings via: UPDATE rag_documents SET embedding = ai_embedding(content);

INSERT INTO rag_documents (content, metadata, source, category) VALUES
(
    E'User Authentication API v2\n\nPOST /api/v2/auth/login\n- Request: { "email": "string", "password": "string", "mfa_token": "string?" }\n- Response: { "access_token": "JWT", "refresh_token": "string", "expires_in": 3600 }\n- Error 401: Invalid credentials\n- Error 403: MFA required\n\nPOST /api/v2/auth/refresh\n- Request: { "refresh_token": "string" }\n- Response: { "access_token": "JWT", "expires_in": 3600 }\n\nPOST /api/v2/auth/logout\n- Headers: Authorization: Bearer {token}\n- Response: { "success": true }',
    '{"api_version": "v2", "domain": "authentication", "tags": ["auth", "login", "jwt"]}',
    'internal_api_docs',
    'api_doc'
),
(
    E'Payment Processing Service Architecture\n\nThe Payment Processing Service handles all payment-related operations including:\n- Credit card processing (Stripe, Adyen integrations)\n- Invoice generation and management\n- Refund processing\n- Subscription billing\n\nHigh-level flow:\n1. Client initiates payment via POST /payments\n2. Service validates payment method\n3. Payment gateway adapter routes to appropriate provider\n4. Webhook listeners handle async confirmations\n5. Event bus publishes payment.status_changed events\n\nKey components:\n- PaymentGatewayAdapter (abstracts Stripe/Adyen)\n- WebhookHandler (processes provider callbacks)\n- InvoiceGenerator (creates PDF invoices)\n- SubscriptionManager (handles recurring billing)',
    '{"service": "payment", "team": "payments-squad", "tags": ["payment", "architecture", "stripe"]}',
    'architecture_docs',
    'architecture'
),
(
    E'Business Rule: Order Cancellation Policy\n\n1. Customers may cancel orders within 24 hours of placement without penalty.\n2. Orders in "processing" status can be cancelled with approval from Customer Service.\n3. Orders in "shipped" status cannot be cancelled; customer must initiate return.\n4. Refunds for cancelled orders are processed within 5-7 business days.\n5. Subscription orders follow special cancellation rules (see Subscription Policy BR-042).\n6. Bulk orders (>100 items) require manager approval for cancellation.',
    '{"rule_id": "BR-038", "domain": "orders", "priority": "high"}',
    'business_rules',
    'business_rule'
),
(
    E'User Profile Management API\n\nGET /api/v2/users/{userId}/profile\n- Returns: { "userId": "uuid", "email": "string", "firstName": "string", "lastName": "string", "preferences": {}, "createdAt": "ISO8601" }\n\nPATCH /api/v2/users/{userId}/profile\n- Request: partial update of profile fields\n- Validation: email must be unique, phone optional but validated format\n\nDELETE /api/v2/users/{userId}/profile\n- Soft delete: marks account as inactive\n- GDPR compliance: triggers data anonymization workflow\n- Cascade: cancels active subscriptions, preserves order history',
    '{"api_version": "v2", "domain": "user_management", "tags": ["user", "profile", "gdpr"]}',
    'internal_api_docs',
    'api_doc'
),
(
    E'Microservices Communication Patterns\n\nSynchronous (for real-time operations):\n- REST HTTP/JSON for external APIs\n- gRPC for internal service-to-service (orders → inventory)\n\nAsynchronous (for eventual consistency):\n- Apache Kafka for event streaming (order events, payment events)\n- RabbitMQ for task queues (email sending, report generation)\n\nCircuit Breaker Pattern:\n- Implemented in API Gateway for all downstream services\n- Threshold: 50% error rate over 30 seconds\n- Recovery: exponential backoff starting at 1s, max 60s\n\nService Discovery:\n- Consul for service registration\n- Health checks every 10s',
    '{"pattern": "communication", "team": "platform", "tags": ["microservices", "kafka", "grpc", "circuit-breaker"]}',
    'architecture_docs',
    'architecture'
),
(
    E'GDPR Compliance Requirements\n\nData Subject Rights:\n1. Right to Access: Users can request all personal data within 30 days\n2. Right to Rectification: Users can correct inaccurate data\n3. Right to Erasure (Right to be Forgotten): Users can request deletion\n4. Right to Restrict Processing: Users can limit how data is used\n5. Right to Data Portability: Users can export data in machine-readable format\n\nTechnical Implementation:\n- All PII fields encrypted at rest (AES-256)\n- Data anonymization pipeline for deleted accounts\n- Audit log for all data access (retained 7 years)\n- Consent management with granular opt-in/opt-out\n- Data Processing Agreements (DPAs) with all third-party processors',
    '{"regulation": "GDPR", "domain": "compliance", "priority": "critical"}',
    'compliance_docs',
    'business_rule'
),
(
    E'Inventory Management Service\n\nResponsibilities:\n- Real-time stock level tracking\n- Reservation management (hold stock during checkout)\n- Reorder point calculations\n- Warehouse allocation logic\n\nKey APIs:\nGET /inventory/{sku}/availability\n- Query params: warehouse_id, quantity\n- Returns: available, reserved, on_order, reorder_point\n\nPOST /inventory/reserve\n- Request: { "sku": "string", "quantity": number, "orderId": "string", "ttl": 900 }\n- TTL default: 15 minutes (configurable per tenant)\n\nPOST /inventory/release\n- Releases reservation by orderId\n- Idempotent: safe to call multiple times',
    '{"service": "inventory", "team": "fulfillment", "tags": ["inventory", "stock", "reservation"]}',
    'internal_api_docs',
    'api_doc'
),
(
    E'Database Schema: Orders Table\n\nTable: orders\n- id: UUID PRIMARY KEY\n- user_id: UUID NOT NULL REFERENCES users(id)\n- status: ENUM (pending, processing, shipped, delivered, cancelled, refunded)\n- total_amount: DECIMAL(10,2) NOT NULL\n- currency: CHAR(3) DEFAULT ''USD''\n- shipping_address: JSONB NOT NULL\n- billing_address: JSONB NOT NULL\n- payment_method_id: UUID REFERENCES payment_methods(id)\n- created_at: TIMESTAMP DEFAULT NOW()\n- updated_at: TIMESTAMP DEFAULT NOW()\n- metadata: JSONB DEFAULT ''{}''\n\nIndexes:\n- idx_orders_user_id ON orders(user_id)\n- idx_orders_status ON orders(status)\n- idx_orders_created_at ON orders(created_at)\n\nPartitioning:\n- Partitioned by range on created_at (monthly partitions)\n- Retention: 2 years hot storage, then archive to S3',
    '{"table": "orders", "database": "primary", "team": "data"}',
    'database_docs',
    'architecture'
);

-- =============================================================================
-- SEED DATA: Mock Meeting Notes
-- =============================================================================

INSERT INTO rag_documents (content, metadata, source, category) VALUES
(
    E'Meeting Notes: Sprint 24 Planning — Payment Gateway Refactoring\n\nDate: 2024-05-15\nAttendees: Sarah (PM), Mike (Tech Lead), Anna (Backend), Raj (DevOps)\n\nKey Decisions:\n1. Migrate from Stripe-only to multi-provider (Stripe + Adyen)\n2. Implement circuit breaker for gateway failures\n3. Add webhook retry logic with exponential backoff\n4. Create payment-adapter abstraction layer\n\nAction Items:\n- Anna: Design adapter interface by May 22\n- Mike: Review ADR for multi-provider approach\n- Raj: Set up staging environment with Adyen sandbox\n- Sarah: Update project timeline (+2 weeks)\n\nRisks:\n- Adyen integration complexity may delay launch\n- Need PCI compliance re-certification\n\nDependencies:\n- Requires Inventory Service v3.2 (reservation API)\n- Blocked by Auth Service MFA rollout',
    '{"meeting_type": "sprint_planning", "sprint": 24, "project": "payment-refactor"}',
    'meeting_notes',
    'business_rule'
),
(
    E'Meeting Notes: Architecture Review — User Data Platform\n\nDate: 2024-05-20\nAttendees: CTO, Head of Engineering, Data Team Leads\n\nProposal: Build centralized User Data Platform (UDP)\n\nArchitecture Highlights:\n- Event sourcing for user activity streams\n- Real-time analytics via Kafka + Flink\n- ML feature store for personalization\n- Data lake (S3) for historical analysis\n\nConcerns Raised:\n1. Data privacy: Need privacy-by-design approach\n2. Performance: Event sourcing may add latency\n3. Cost: Storage costs for event log\n4. Migration: Gradual migration from monolith\n\nApproved with Conditions:\n- POC phase: 6 weeks\n- Start with read-only analytics\n- GDPR compliance audit before go-live\n- Budget cap: $50K for POC\n\nNext Steps:\n- Assign dedicated team (4 engineers)\n- Kickoff: June 3\n- Checkpoint review: July 15',
    '{"meeting_type": "architecture_review", "project": "user-data-platform"}',
    'meeting_notes',
    'architecture'
);

-- =============================================================================
-- SEED DATA: Mock Jira Ticket Summaries
-- =============================================================================

INSERT INTO rag_documents (content, metadata, source, category) VALUES
(
    E'JIRA-2847: Implement OAuth 2.0 PKCE for Mobile Apps\n\nType: Story | Priority: High | Status: In Progress | Sprint: 24\nAssignee: David Chen | Reporter: Product Team\n\nDescription:\nMobile apps currently use Resource Owner Password Credentials flow which is deprecated. Need to migrate to OAuth 2.0 with PKCE (Proof Key for Code Exchange) for enhanced security.\n\nAcceptance Criteria:\n1. Mobile login uses PKCE flow\n2. Authorization code + code_challenge generated client-side\n3. Token refresh works seamlessly\n4. Backward compatibility: existing sessions remain valid\n5. Documentation updated for mobile developers\n\nTechnical Notes:\n- Use Auth0 SDK for PKCE implementation\n- Store code_verifier in secure enclave (iOS) / Keystore (Android)\n- Token storage: Keychain/Keystore only, no plaintext\n\nRelated:\n- Blocks: JIRA-2901 (Biometric auth)\n- Depends on: JIRA-2789 (Auth service v3)',
    '{"ticket_id": "JIRA-2847", "type": "story", "priority": "high", "status": "in_progress"}',
    'jira_tickets',
    'business_rule'
),
(
    E'JIRA-2905: Add Real-Time Order Tracking via WebSocket\n\nType: Story | Priority: Medium | Status: Backlog | Sprint: Unassigned\nAssignee: TBD | Reporter: Customer Experience\n\nDescription:\nCustomers currently receive order updates via email only. Need real-time tracking page with live status updates.\n\nAcceptance Criteria:\n1. WebSocket connection for live order status\n2. Connection drops handled gracefully (auto-reconnect)\n3. Status updates: ordered → processing → shipped → out_for_delivery → delivered\n4. Push notifications for status changes (optional opt-in)\n5. Estimated delivery time calculation\n\nTechnical Notes:\n- WebSocket server: separate service (ws-service)\n- Redis pub/sub for order event broadcasting\n- Connection limit: 100K concurrent per instance\n- Fallback: SSE (Server-Sent Events) for older browsers\n\nRelated:\n- Blocks: JIRA-2910 (Customer notification preferences)\n- Depends on: JIRA-2888 (Order event system)',
    '{"ticket_id": "JIRA-2905", "type": "story", "priority": "medium", "status": "backlog"}',
    'jira_tickets',
    'business_rule'
),
(
    E'JIRA-2876: Database Partitioning for Orders Table\n\nType: Technical Debt | Priority: High | Status: Done | Sprint: 23\nAssignee: Maria Garcia | Reporter: Platform Team\n\nDescription:\nOrders table has grown to 50M rows. Query performance degraded. Need monthly partitioning + archival strategy.\n\nImplementation:\n1. Created monthly partitions (range on created_at)\n2. Applied to production: May 10, 2024\n3. Archival job: moves data >2 years to S3 (Parquet format)\n4. Query planner updated with partition pruning hints\n\nResults:\n- Query time improved: 450ms → 45ms (p95)\n- Storage reduced: 2.1TB → 800GB (active) + archived\n- Maintenance window: 2 hours (zero downtime using logical replication)\n\nLessons Learned:\n- Test partition creation automation thoroughly\n- Monitor replication lag during migration\n- Have rollback plan (kept original table for 48h)',
    '{"ticket_id": "JIRA-2876", "type": "technical_debt", "priority": "high", "status": "done"}',
    'jira_tickets',
    'architecture'
);

-- =============================================================================
-- SEED DATA: Mock Document Drafts (for HITL testing)
-- =============================================================================

INSERT INTO document_drafts (session_id, title, template_type, content, diagrams, sources, status) VALUES
(
    'demo-session-001',
    'Payment Gateway Refactoring — Requirements Specification',
    'requirements',
    E'# Payment Gateway Refactoring — Requirements Specification\n\n## 1. Introduction\n### 1.1 Purpose\nThis document specifies requirements for refactoring the payment processing system to support multiple payment providers.\n\n### 1.2 Scope\nCovers payment gateway abstraction, webhook handling, and provider failover mechanisms.\n\n## 2. System Features\n### 2.1 Multi-Provider Support\nThe system shall support at least two payment providers: Stripe and Adyen.\n\n### 2.2 Circuit Breaker\nAutomatic failover when a provider exceeds 50% error rate over 30 seconds.\n\n### 2.3 Webhook Reliability\nExponential backoff retry for failed webhook deliveries (max 5 attempts).\n\n## 3. Non-Functional Requirements\n- Availability: 99.95% uptime\n- Latency: P95 < 500ms for payment initiation\n- PCI DSS Level 1 compliance',
    '[{"type": "mermaid", "name": "Payment Flow", "content": "flowchart TD\n    A[Client] -->|POST /payments| B[API Gateway]\n    B --> C[Payment Service]\n    C --> D{Provider Selector}\n    D -->|Primary| E[Stripe Adapter]\n    D -->|Fallback| F[Adyen Adapter]\n    E --> G[Webhook Handler]\n    F --> G\n    G --> H[Event Bus]"}]'::jsonb,
    '{"jira_tickets": ["JIRA-2847"], "meeting_notes": ["Sprint 24 Planning"]}'::jsonb,
    'pending_review'
);

-- =============================================================================
-- Done!
-- =============================================================================
-- To verify: SELECT * FROM document_templates;
--            SELECT * FROM rag_documents;
--            SELECT * FROM document_drafts;
