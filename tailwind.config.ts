import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e7f3f1', 100: '#c3e5e0', 200: '#8fccc4',
          500: '#16a294', 600: '#138e83', 700: '#0f6b63',
          800: '#0c544e', 900: '#0a423d',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
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
            color: '#4b463d',
            '--tw-prose-headings': '#23211c',
            '--tw-prose-bold': '#23211c',
            '--tw-prose-links': '#0f6b63',
            '--tw-prose-quote-borders': '#0f6b63',
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
