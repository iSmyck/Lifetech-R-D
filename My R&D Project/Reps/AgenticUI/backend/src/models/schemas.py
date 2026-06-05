"""Pydantic request/response schemas for the EGM AI API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Input / Output Schemas
# ---------------------------------------------------------------------------


class UserContext(BaseModel):
    user_id: str = "anonymous"
    language_preference: str = "en"
    market_focus: str = ""


class AdditionalParameters(BaseModel):
    urgency: str = "medium"
    output_format_preference: str = "json"


class QueryInput(BaseModel):
    user_query: str = Field(..., min_length=1, max_length=10000)
    query_id: str | None = None
    user_context: UserContext = Field(default_factory=UserContext)
    additional_parameters: AdditionalParameters = Field(default_factory=AdditionalParameters)


class ExecutedAgent(BaseModel):
    agent_name: str
    status: str  # completed | failed | reviewed
    output_summary: str


class QueryResponse(BaseModel):
    query_id: str
    status: str  # processing | completed | pending_review | error
    final_response: str = ""
    response_summary: str = ""
    executed_agents: list[ExecutedAgent] = Field(default_factory=list)
    review_status: str = "N/A"  # approved | needs_review | rejected | N/A
    processing_time_ms: int = 0
    timestamp: str = ""


# ---------------------------------------------------------------------------
# Agent Output Schemas
# ---------------------------------------------------------------------------


class LocalizedContent(BaseModel):
    text: str
    image_suggestions: str = ""
    call_to_action: str
    bilingual_version: dict[str, str] = Field(default_factory=dict)


class LocalizationReport(BaseModel):
    cultural_codes_applied: list[str] = Field(default_factory=list)
    generational_lens: str = ""
    market_insights_applied: str = ""
    cultural_sensitivities_addressed: list[str] = Field(default_factory=list)
    local_benchmarking_references: list[str] = Field(default_factory=list)
    potential_risks_flagged: list[str] = Field(default_factory=list)


class LocalizationOutput(BaseModel):
    query_id: str
    localized_content: LocalizedContent
    localization_report: LocalizationReport
    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    timestamp: str = ""


class RegulatoryFinding(BaseModel):
    regulation_body: str
    issue_type: str
    description: str
    severity: str  # low | medium | high | critical
    recommended_action: str


class PlatformPolicyFinding(BaseModel):
    platform: str
    policy_violation: str
    description: str
    severity: str


class RedlineViolation(BaseModel):
    redline_category: str
    description: str
    severity: str = "critical"


class ClaimStatus(BaseModel):
    claim: str
    status: str  # substantiated | unsubstantiated
    reason: str


class ComplianceReport(BaseModel):
    overall_status: str  # compliant | needs_review | non_compliant
    regulatory_findings: list[RegulatoryFinding] = Field(default_factory=list)
    platform_policy_findings: list[PlatformPolicyFinding] = Field(default_factory=list)
    egm_ai_policy_redlines_violations: list[RedlineViolation] = Field(default_factory=list)
    claims_substantiation_status: list[ClaimStatus] = Field(default_factory=list)


class GovernanceOutput(BaseModel):
    query_id: str
    compliance_report: ComplianceReport
    flag_for_hitl: bool = False
    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    timestamp: str = ""


class RecommendedChannel(BaseModel):
    platform: str
    placement: str
    rationale: str
    audience_fit_score: float = Field(0.0, ge=0.0, le=1.0)
    estimated_cpm_range: str = ""
    estimated_spend: float = 0.0
    bid_strategy_suggestion: str = ""


class BudgetAllocation(BaseModel):
    total: float
    by_platform: dict[str, float] = Field(default_factory=dict)


class CreativeFatiguePrediction(BaseModel):
    risk_level: str = "low"  # low | medium | high
    refresh_frequency_suggestion: str = ""
    reasoning: str = ""


class TestingMatrix(BaseModel):
    variables: list[str] = Field(default_factory=list)
    priority_tests: list[str] = Field(default_factory=list)


class PerformanceForecast(BaseModel):
    estimated_reach: str = ""
    estimated_impressions: str = ""
    estimated_clicks: str = ""
    estimated_conversions: str = ""
    confidence_level: str = "medium"  # low | medium | high


class PerformanceOutput(BaseModel):
    query_id: str
    media_strategy: dict[str, Any] = Field(default_factory=dict)
    performance_forecast: PerformanceForecast = Field(default_factory=PerformanceForecast)
    platform_comparison: str = ""
    timestamp: str = ""


class ContentVariant(BaseModel):
    variant_id: str
    text: str
    hook_type: str


class LanguageContent(BaseModel):
    headline: str
    body: str
    call_to_action: str
    hashtags: list[str] = Field(default_factory=list)
    hook_type_used: str = ""


class GeneratedContent(BaseModel):
    primary_language_content: LanguageContent
    secondary_language_content: LanguageContent | None = None
    variants: list[ContentVariant] = Field(default_factory=list)


class CreativeSummary(BaseModel):
    cultural_elements_incorporated: str = ""
    few_shot_inspiration: str = ""
    adherence_to_brief: str = ""
    potential_improvements: str = ""


class ContentOutput(BaseModel):
    query_id: str
    generated_content: GeneratedContent
    creative_summary: CreativeSummary
    timestamp: str = ""


class Inconsistency(BaseModel):
    between_agents: list[str]
    description: str
    severity: str


class RiskFlag(BaseModel):
    source_agent: str
    flag_type: str
    description: str
    severity: str  # low | medium | high | critical


class AutoRepair(BaseModel):
    field: str
    original: Any
    repaired: Any
    reason: str


class ValidationOutput(BaseModel):
    query_id: str
    validation_status: str  # valid_and_safe | needs_review | critical_error
    consistency_report: dict[str, Any] = Field(default_factory=dict)
    aggregated_risk_flags: list[RiskFlag] = Field(default_factory=list)
    auto_repairs_applied: list[AutoRepair] = Field(default_factory=list)
    flag_for_hitl: bool = False
    hitl_reason: str = ""
    timestamp: str = ""


# ---------------------------------------------------------------------------
# HITL Schemas
# ---------------------------------------------------------------------------


class ReviewDecision(BaseModel):
    reviewer_decision: str  # approve | reject | edit
    reviewer_notes: str = ""
    edited_output: dict[str, Any] | None = None


class ReviewResponse(BaseModel):
    review_id: str
    status: str
    decision: str | None = None
    message: str = ""


class PendingReview(BaseModel):
    review_id: str
    query_id: str | None
    flag_reason: str
    severity: str
    status: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Session Schemas
# ---------------------------------------------------------------------------


class SessionResponse(BaseModel):
    session_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    status: str
    total_queries: int
    queries: list[QueryResponse] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# SSE Event Schemas
# ---------------------------------------------------------------------------


class AgentStepEvent(BaseModel):
    event: str = "agent_step"
    agent_name: str
    step_label: str
    status: str  # pending | running | done
    timestamp: str


class AgentCompleteEvent(BaseModel):
    event: str = "agent_complete"
    agent_name: str
    output_summary: str
    timestamp: str


class ValidationEvent(BaseModel):
    event: str = "validation"
    validation_status: str
    flag_for_hitl: bool
    timestamp: str


class FinalResponseEvent(BaseModel):
    event: str = "final_response"
    query_id: str
    final_response: str
    timestamp: str
