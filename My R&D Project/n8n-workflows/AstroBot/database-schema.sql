-- AstroBot PostgreSQL Database Schema
-- Phase 1: Natal Chart + Phase 2: Forecasts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table: stores birth data, cached natal chart, and settings
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    full_name VARCHAR(255),
    state VARCHAR(50) DEFAULT 'INIT',

    -- Birth data
    birth_date DATE,
    birth_time TIME WITHOUT TIME ZONE,
    birth_city VARCHAR(255),
    birth_latitude DECIMAL(8,6),
    birth_longitude DECIMAL(9,6),
    birth_timezone VARCHAR(50),
    birth_nation VARCHAR(2),

    -- Cached natal chart (immutable once calculated)
    chart_context_xml TEXT,
    chart_data_json JSONB,
    chart_calculated_at TIMESTAMP WITH TIME ZONE,

    -- Forecast settings
    daily_forecast_enabled BOOLEAN DEFAULT FALSE,
    forecast_time TIME WITHOUT TIME ZONE DEFAULT '07:00',
    forecast_timezone VARCHAR(50),
    forecast_location_city VARCHAR(255),
    forecast_location_latitude DECIMAL(8,6),
    forecast_location_longitude DECIMAL(9,6),

    -- Localization
    language VARCHAR(10) DEFAULT 'ru',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_state ON users(state);
CREATE INDEX idx_users_daily_forecast ON users(daily_forecast_enabled) WHERE daily_forecast_enabled = TRUE;

-- Daily forecasts log
CREATE TABLE daily_forecasts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    transit_context_xml TEXT,
    forecast_text TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, forecast_date)
);

CREATE INDEX idx_daily_forecasts_user_date ON daily_forecasts(user_id, forecast_date);
CREATE INDEX idx_daily_forecasts_sent ON daily_forecasts(sent_at) WHERE sent_at IS NULL;

-- RAG interpretations source of truth (also used to seed Qdrant)
CREATE TABLE rag_interpretations (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,  -- 'planet_in_sign', 'planet_in_house', 'aspect', 'house_meaning', 'sign_meaning'
    planet VARCHAR(30),
    sign VARCHAR(30),
    house INTEGER,
    aspect_type VARCHAR(30),
    p1 VARCHAR(30),
    p2 VARCHAR(30),
    keywords TEXT[],
    interpretation_text TEXT NOT NULL,
    element VARCHAR(10),
    quality VARCHAR(10),
    language VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rag_category ON rag_interpretations(category);
CREATE INDEX idx_rag_planet ON rag_interpretations(planet);
CREATE INDEX idx_rag_sign ON rag_interpretations(sign);
CREATE INDEX idx_rag_keywords ON rag_interpretations USING GIN(keywords);

-- Error log for debugging and monitoring
CREATE TABLE error_log (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    workflow_name VARCHAR(100),
    error_message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_log_telegram_id ON error_log(telegram_id);
CREATE INDEX idx_error_log_created_at ON error_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PGVector table for RAG embeddings (used by n8n AI Agent PGVector Store)
CREATE TABLE rag_embeddings (
    id SERIAL PRIMARY KEY,
    interpretation_id INTEGER REFERENCES rag_interpretations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536)
);

CREATE INDEX idx_rag_embeddings_vector ON rag_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Chat memory table for n8n AI Agent Postgres Chat Memory
CREATE TABLE chat_memory (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_memory_session ON chat_memory(session_id);
CREATE INDEX idx_chat_memory_created ON chat_memory(created_at);
