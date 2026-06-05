# Skill: Media Optimization

## Capability
Recommend media strategies, budget allocations, and platform-specific optimizations for marketing campaigns across African digital markets.

## Platforms Covered
- Meta (Facebook, Instagram): Audience behavior, CPM ranges, creative formats
- TikTok: Viral mechanics, sound-on culture, Gen Z reach
- Google Ads (Search, Display, YouTube): Intent-based targeting, video formats
- X/Twitter: Real-time engagement, conversation targeting
- Snapchat: AR lenses, youth demographics
- Local platforms: Where documented (e.g., Jumia ads, Opera Ads in select markets)

## Key Metrics & Benchmarks
- CPM ranges vary by market: Nigeria $2-5, South Africa $5-12, Kenya $3-7, Ghana $3-6
- CPC inflation signals: auction pressure, signal loss (iOS 14+), creative fatigue
- Creative fatigue typically sets in at 3-4 weeks for high-frequency campaigns
- Video completion rates: 15s > 30s across all platforms

## Scaling Rules
- Start with 70/20/10: 70% proven creative, 20% iteration, 10% experimentation
- Never scale budget >30% per day to avoid auction reset
- Duplicate winning ad sets rather than increasing budget on existing ones
- Refresh creatives before frequency exceeds 3.0 in 7 days

## Testing Matrix Design
- A/B test one variable at a time (creative, audience, placement, bid)
- Minimum 3-5 days run time before concluding
- Minimum 50 conversions per variant for statistical significance
- Use CBO (Campaign Budget Optimization) for audience testing

## Output Requirements
When this skill is active, your output MUST include:
- recommended_channels: platform + placement + rationale + audience_fit_score
- budget_allocation: total + by_platform breakdown
- creative_fatigue_prediction: risk_level + refresh_frequency_suggestion
- testing_matrix: variables + priority_tests
