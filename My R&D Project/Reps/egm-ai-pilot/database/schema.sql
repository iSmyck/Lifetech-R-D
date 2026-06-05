-- EGM AI Pilot Database Schema
-- PostgreSQL with pgvector extension prepared

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pgvector (prepared but not connected in pilot)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Sessions table
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    context_summary TEXT,
    total_queries INTEGER DEFAULT 0
);

-- Queries table
CREATE TABLE queries (
    query_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(session_id),
    user_query TEXT NOT NULL,
    classified_intent VARCHAR(255),
    execution_plan JSONB,
    agent_outputs JSONB,
    final_response JSONB,
    validation_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    processing_time_ms INTEGER
);

-- HITL Queue
CREATE TABLE hitl_queue (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES queries(query_id),
    flagged_by VARCHAR(100),
    flag_reason TEXT,
    severity VARCHAR(20),
    review_package JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    reviewer_id VARCHAR(255),
    reviewer_decision VARCHAR(50),
    reviewer_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Case Memory (approved outputs for few-shot reuse)
CREATE TABLE case_memory (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES queries(query_id),
    market VARCHAR(100),
    product_category VARCHAR(100),
    intent_type VARCHAR(100),
    input_summary TEXT,
    approved_output JSONB,
    quality_score NUMERIC(3,2),
    reuse_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    approved_by VARCHAR(255)
);

-- Agent execution log (lightweight, for pilot)
CREATE TABLE agent_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES queries(query_id),
    agent_name VARCHAR(100),
    model_used VARCHAR(100),
    input_tokens INTEGER,
    output_tokens INTEGER,
    execution_time_ms INTEGER,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_queries_session ON queries(session_id);
CREATE INDEX idx_queries_created ON queries(created_at);
CREATE INDEX idx_hitl_status ON hitl_queue(status);
CREATE INDEX idx_hitl_created ON hitl_queue(created_at);
CREATE INDEX idx_case_memory_market ON case_memory(market, product_category);
CREATE INDEX idx_case_memory_intent ON case_memory(intent_type);
CREATE INDEX idx_agent_log_query ON agent_log(query_id);
CREATE INDEX idx_agent_log_agent ON agent_log(agent_name);
CREATE INDEX idx_sessions_user ON sessions(user_id);
