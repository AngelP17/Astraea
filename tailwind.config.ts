import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: '#111113',
        'surface-2': '#1A1A1F',
        border: 'rgba(255,255,255,0.06)',
        'border-hover': 'rgba(255,255,255,0.12)',
        indigo: {
          DEFAULT: '#6366F1',
          hover: '#818CF8',
          glow: 'rgba(99, 102, 241, 0.15)',
        },
        cyan: '#00F0FF',
        violet: '#8B5CF6',
        amber: '#FFD016',
        success: '#10B981',
        danger: '#EF4444',
        text: '#FAFAFA',
        'text-muted': '#71717A',
        'text-dim': '#3F3F46',
      },
      duration: {
        fast: '100ms',
        normal: '200ms',
        slow: '400ms',
      },
      ease: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body-base': ['16px', { lineHeight: '1.6' }],
        'label': ['11px', { lineHeight: '1', letterSpacing: '0.08em' }],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'glow-pulse': { '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }, '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 400ms var(--ease-out-expo) forwards',
        'fade-up': 'fade-up 400ms var(--ease-out-expo) forwards',
        'scale-in': 'scale-in 200ms var(--ease-out-quart) forwards',
        'slide-in-right': 'slide-in-right 300ms var(--ease-out-expo) forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
