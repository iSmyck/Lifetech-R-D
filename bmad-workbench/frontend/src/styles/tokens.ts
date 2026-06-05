// BMAD Corporate Visual Identity Tokens
// TypeScript definitions for programmatic use

export const colors = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',

  bg: 'var(--bmad-bg)',
  surface: 'var(--bmad-surface)',
  surfaceRaised: 'var(--bmad-surface-raised)',
  border: 'var(--bmad-border)',
  text: 'var(--bmad-text)',
  muted: 'var(--bmad-muted)',

  status: {
    success: '#10b981',
    successGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    warning: '#f59e0b',
    warningGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    error: '#f43f5e',
    errorGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    info: '#3b82f6',
    infoGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  },
} as const;

export const typography = {
  display: { size: '24px', lineHeight: '32px', fontWeight: 700 },
  heading: { size: '18px', lineHeight: '24px', fontWeight: 600 },
  body: { size: '14px', lineHeight: '20px', fontWeight: 400 },
  caption: { size: '12px', lineHeight: '16px', fontWeight: 500 },
  label: { size: '11px', lineHeight: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  12: '48px',
} as const;

export const borderRadius = {
  button: '6px',
  card: '8px',
  panel: '12px',
  modal: '16px',
} as const;

export const shadows = {
  sm: 'var(--bmad-shadow-sm)',
  md: 'var(--bmad-shadow-md)',
  lg: 'var(--bmad-shadow-lg)',
  elevated: 'var(--bmad-shadow-elevated)',
} as const;

export const transitions = {
  micro: '150ms ease',
  state: '200ms ease-out',
  card: '200ms ease-out',
} as const;

export const zIndex = {
  base: 0,
  sticky: 10,
  dropdown: 20,
  modal: 30,
  overlay: 40,
  toast: 50,
} as const;
