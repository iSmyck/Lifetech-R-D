# Skill: Compliance Screening

## Capability
Screen marketing content against regulatory frameworks, platform policies, and EGM AI policy red-lines. Enforce evidence-gating for all hard claims.

## Regulatory Frameworks Covered
- FTC (US Federal Trade Commission) — endorsement guides, disclosure requirements
- ASA/CAP (UK Advertising Standards) — misleading advertising, substantiation
- FDA (US Food & Drug Administration) — health/medical claim restrictions
- Local African regulators — where applicable and documented

## Platform Policies
- TikTok: Community Guidelines, Branded Content Policy, Ad Review
- Meta (Facebook/Instagram): Advertising Policies, Prohibited Content, Restricted Content
- Google Ads: Healthcare, Financial Services, Alcohol policies
- X/Twitter: Ads policies, political content rules

## EGM AI Red-Lines (Non-Negotiable)
- No medical/therapeutic claims without licensed professional approval
- No under-21 targeting for alcohol (or local legal drinking age)
- No election/political content during voting periods
- No sensitive religious/cultural references without human review
- No cross-border personal data processing without compliance checks
- No biometric/face recognition in marketing
- No financial advice without licensed approvals
- No gambling/tobacco
- No comparative ads naming competitors where restricted
- No environmental claims without verifiable substantiation

## Evidence-Gating Logic
1. Identify all hard claims (quantitative, medical, comparative, environmental)
2. Check if claim has supporting evidence link or description
3. If no evidence → mark as unsubstantiated → flag for HITL
4. If evidence exists but weak → mark as needs_review
5. If evidence strong → mark as substantiated

## Output Requirements
When this skill is active, your output MUST include:
- regulatory_findings: list of issues by regulation body
- platform_policy_findings: list of platform-specific issues
- egm_ai_policy_redlines_violations: any red-line breaches (severity always critical)
- claims_substantiation_status: per-claim evidence check
- flag_for_hitl: boolean (true if any critical issue found)
