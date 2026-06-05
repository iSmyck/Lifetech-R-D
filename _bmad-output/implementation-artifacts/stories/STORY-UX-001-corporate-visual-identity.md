# STORY-UX-001: Corporate Visual Identity System

## Status: ✅ Done

## Problem
The application uses GitHub Dark's exact color palette (`#0d1117`, `#161b22`, `#30363d`), making it look like a developer tool rather than a corporate AI workbench. There is no distinct brand identity, typography hierarchy, or visual elevation system.

## Solution
Define and implement a distinct corporate visual identity system that feels premium, trustworthy, and purpose-built for AI-assisted product management.

## Acceptance Criteria

### Color Palette
- [ ] Define `bmad-primary`: a distinct accent color (recommendation: deep violet `#6366f1` is fine, but add a vibrant gradient variant)
- [ ] Define semantic status colors:
  - Success: emerald gradient (not flat)
  - Warning: amber gradient
  - Error: rose gradient
  - Info: blue gradient
- [ ] Add elevation levels via background colors:
  - `bmad-bg`: `#0a0e14` (deeper than current, less blue-gray)
  - `bmad-surface`: `#111820` (warm dark, not GitHub slate)
  - `bmad-surface-raised`: `#1a2330` (for cards, panels)
  - `bmad-border`: `rgba(255,255,255,0.08)` (subtle, not harsh)
- [ ] Add subtle background gradient or texture to break flatness

### Typography Scale
- [ ] Define typography tokens:
  - `display`: 24px/32px, font-weight 700 (page titles)
  - `heading`: 18px/24px, font-weight 600 (section headers)
  - `body`: 14px/20px, font-weight 400 (card content)
  - `caption`: 12px/16px, font-weight 500 (labels, badges)
  - `label`: 11px/14px, font-weight 600, uppercase, letter-spacing 0.05em (tab labels)
- [ ] Apply scale consistently across all components

### Spacing & Shape
- [ ] Border radius scale: 6px (buttons), 8px (cards), 12px (panels), 16px (modals)
- [ ] Shadow system for elevation:
  - `shadow-sm`: `0 1px 2px rgba(0,0,0,0.3)`
  - `shadow-md`: `0 4px 12px rgba(0,0,0,0.4)`
  - `shadow-lg`: `0 8px 24px rgba(0,0,0,0.5)`
- [ ] Consistent spacing: 4px base unit (4, 8, 12, 16, 20, 24, 32, 48)

### Logo & Branding
- [ ] Add BMAD wordmark/logo in the top-left of Thread Navigator
- [ ] Add subtle brand accent line (1px gradient) below the global header

### Animation Language
- [ ] Micro-interactions: 150ms ease for hover, 200ms ease-out for state changes
- [ ] Card entrance: fade-up 200ms with 20ms stagger
- [ ] Loading states: skeleton shimmer instead of text

## Technical Notes

**Files to modify:**
- `frontend/tailwind.config.js` — add new color tokens, spacing, shadows, borderRadius
- `frontend/src/index.css` — update base styles, add CSS variables
- `frontend/src/App.tsx` — add global header with logo
- All component files — apply new tokens

**New files:**
- `frontend/src/styles/tokens.ts` — TypeScript token definitions for programmatic use

**Dependencies:** None new.

## Effort: M (2-3 days)

## Dependencies: None
