/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        bmad: {
          bg: 'var(--bmad-bg)',
          surface: 'var(--bmad-surface)',
          'surface-raised': 'var(--bmad-surface-raised)',
          border: 'var(--bmad-border)',
          text: 'var(--bmad-text)',
          muted: 'var(--bmad-muted)',
          primary: '#6366f1',
          'primary-light': '#818cf8',
          'primary-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        },
        status: {
          success: '#10b981',
          'success-gradient': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          warning: '#f59e0b',
          'warning-gradient': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          error: '#f43f5e',
          'error-gradient': 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
          info: '#3b82f6',
          'info-gradient': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        }
      },
      fontSize: {
        'display': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'heading': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label': ['11px', { lineHeight: '14px', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        'button': '6px',
        'card': '8px',
        'panel': '12px',
        'modal': '16px',
      },
      boxShadow: {
        'bmad-sm': 'var(--bmad-shadow-sm)',
        'bmad-md': 'var(--bmad-shadow-md)',
        'bmad-lg': 'var(--bmad-shadow-lg)',
        'bmad-elevated': 'var(--bmad-shadow-elevated)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      animation: {
        'breathe': 'breathe 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-up': 'fadeUp 0.2s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(99,102,241,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(99,102,241,0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
