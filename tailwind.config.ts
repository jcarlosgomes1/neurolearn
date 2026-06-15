import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe5ff', 200: '#bccfff',
          500: '#5b6cff', 600: '#4753f0', 700: '#3a3fd6',
          800: '#3236aa', 900: '#2c2e85',
        },
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#334155',
            '--tw-prose-headings': '#0f172a',
            '--tw-prose-bold': '#0f172a',
            '--tw-prose-links': '#4753f0',
            '--tw-prose-quote-borders': '#4753f0',
            fontSize: '1.0625rem',
            lineHeight: '1.7',
            h2: { fontWeight: '700', marginTop: '2.5em', marginBottom: '0.75em' },
            h3: { fontWeight: '600', marginTop: '1.8em', marginBottom: '0.5em' },
            p: { marginTop: '1em', marginBottom: '1em' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
