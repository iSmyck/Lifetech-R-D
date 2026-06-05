# Skill: Quality Validation

## Capability
Validate agent outputs against JSON schemas, check cross-agent consistency, aggregate risk flags, and determine if human review is required.

## JSON Schema Validation Rules
1. Every agent output must match its declared schema exactly
2. Required fields must be present and non-null
3. String fields must be strings, arrays must be arrays, objects must be objects
4. Enum values must match allowed values exactly (case-sensitive)
5. Numeric ranges must be respected (e.g., confidence_score 0.0-1.0)

## Cross-Agent Consistency Checks
- If Localization flags cultural sensitivity → verify Content Generation addressed it
- If Governance flags a claim as unsubstantiated → verify it's not presented as fact in Content
- If Performance recommends a platform → verify content format matches that platform's specs
- All agents must reference the same market / audience / product
- Timestamp format consistency (ISO 8601)

## Risk Aggregation Logic
- Collect all risk flags from all agents
- Severity escalation: low → medium → high → critical
- Any single critical = overall critical_error
- Multiple highs without critical = needs_review
- All lows and mediums = valid_and_safe (after auto-repair)

## Auto-Repair Rules
- Type mismatches: coerce if safe (string "1" → number 1), flag if ambiguous
- Missing optional fields: add default values
- Formatting issues: fix spacing, casing, punctuation
- NEVER auto-repair semantic content, claims, or cultural advice
- NEVER auto-repair if critical severity is involved

## Output Requirements
When this skill is active, your output MUST include:
- validation_status: valid_and_safe | needs_review | critical_error
- consistency_report: checks_performed + inconsistencies_found
- aggregated_risk_flags: source_agent + flag_type + description + severity
- auto_repairs_applied: field + original + repaired + reason
- flag_for_hitl: boolean
- hitl_reason: string (empty if not flagged)
