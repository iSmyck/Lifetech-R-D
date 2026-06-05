# STORY-FLOW-003: Light/Dark Theme Toggle

## Status: ✅ Done

## Problem
The application currently only supports dark mode. Some users prefer light themes for daytime work, accessibility needs, or personal preference. Corporate tools must support both modes.

## Solution
Implement a complete light color theme with a toggle switch in the UI, persisted user preference, and system preference detection.

## Design Specifications

### Light Theme Palette
```
--bmad-bg: #ffffff              (pure white background)
--bmad-surface: #f6f8fa         (GitHub-style light surface)
--bmad-surface-raised: #ffffff  (cards on surface)
--bmad-border: #d0d7de          (subtle borders)
--bmad-text: #1f2328            (primary text)
--bmad-text-secondary: #656d76  (muted text)
--bmad-primary: #6366f1         (keep same indigo accent)
--bmad-primary-hover: #4f46e5   (darker for hover)
```

### Dark Theme Palette (Current)
```
--bmad-bg: #0a0e14
--bmad-surface: #111820
--bmad-surface-raised: #1a2330
--bmad-border: rgba(255,255,255,0.08)
--bmad-text: #c9d1d9
--bmad-text-secondary: #8b949e
```

## User Flow

### Step 1 — Toggle Location
- Theme toggle in global header (next to notification bell)
- Icon: 🌙 (moon) in light mode, ☀️ (sun) in dark mode
- Tooltip: "Switch to dark mode" / "Switch to light mode"

### Step 2 — Toggle Action
- User clicks toggle
- Theme switches instantly with 200ms CSS transition
- All components update: background, text, borders, cards, buttons
- Toast notification: "Switched to light mode"

### Step 3 — Persistence
- Preference saved to `localStorage` key `bmad-theme`
- Values: `'light'` | `'dark'` | `'system'`
- On app load: check localStorage → if 'system', use `prefers-color-scheme` media query

### Step 4 — System Preference Detection
- Default for new users: `'system'`
- Listens to `matchMedia('(prefers-color-scheme: dark)')` changes
- If user hasn't manually set preference, follows OS theme
- Once user manually toggles, overrides system preference

## UI Specifications

### Theme Toggle Button
```
┌─────────────┐
│  ☀️  |  🌙  │  ← segmented control
└─────────────┘
```
- Segmented toggle (not just icon switch)
- Shows active state with filled background
- Third option: "Auto" (follows system)

### Settings Modal (Alternative Location)
- User clicks avatar → "Settings" option
- Settings modal with "Appearance" section
- Radio buttons: Light / Dark / System Default
- Preview pane showing a mini stream card in selected theme

## Acceptance Criteria

### CSS / Tailwind
- [ ] All hardcoded colors removed from components
- [ ] Colors use CSS custom properties OR Tailwind dark: variants
- [ ] `dark` class on `<html>` element toggles dark mode
- [ ] 200ms transition on background-color, color, border-color changes

### Components to Theme
- [ ] Global background and surfaces
- [ ] Thread Navigator (left pane)
- [ ] Stream Canvas (center)
- [ ] Context Panel (right pane)
- [ ] Stream cards (user, AI, checkpoint, draft, approval)
- [ ] Draft cards (white in dark → light gray in light)
- [ ] Intent bar
- [ ] Modals and overlays
- [ ] Buttons (primary, secondary, ghost)
- [ ] Form inputs (text, textarea, select)
- [ ] Empty states and skeletons
- [ ] Toast notifications
- [ ] Scrollbars

### State Management
- [ ] `theme` stored in Zustand store
- [ ] `localStorage` persistence
- [ ] System preference detection on load
- [ ] No flash of wrong theme on page load (FOUC prevention)

### Accessibility
- [ ] WCAG 2.1 AA contrast ratios in BOTH themes
- [ ] Focus rings visible in both themes
- [ ] No color-only information (icons + text always)

## Technical Notes

**Files to modify:**
- `frontend/tailwind.config.js` — add `darkMode: 'class'` (already set), ensure all colors use tokens
- `frontend/src/index.css` — define CSS custom properties for both themes
- `frontend/src/App.tsx` — add theme class to html element
- `frontend/src/store/useAppStore.ts` — add theme state

**New files:**
- `frontend/src/components/ThemeToggle.tsx` — toggle button component
- `frontend/src/hooks/useTheme.ts` — theme logic hook

**Implementation approach:**
Option A: CSS custom properties (recommended)
- Define `:root` variables for light theme
- Define `.dark` variables for dark theme
- Components use `var(--bmad-bg)` etc.

Option B: Tailwind `dark:` variants
- `className="bg-white dark:bg-bmad-bg"`
- More verbose but works with existing Tailwind setup

**Recommended: Hybrid approach**
- CSS variables for base colors (bg, surface, text, border)
- Tailwind `dark:` for component-specific variations

## Effort: M (2-3 days)

## Dependencies: STORY-UX-001 (Visual Identity)
