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
        background: '#0a0a0a',
        surface: '#0e0e0e',
        'surface-low': '#131313',
        'surface-high': '#201f1f',
        'surface-highest': '#262626',
        outline: '#777575',
        'outline-variant': '#494847',
        primary: '#a1faff',
        'primary-container': '#00f4fe',
        secondary: '#ac8aff',
        'secondary-container': '#5516be',
        tertiary: '#ffd16f',
        'tertiary-container': '#ffbf00',
        danger: '#ff716c',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(161,250,255,0.08)',
        panel: '0 0 80px rgba(161,250,255,0.06)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
        scanline: 'linear-gradient(to bottom, transparent 50%, rgba(161,250,255,0.04) 50%)',
      },
    },
  },
  plugins: [],
};

export default config;