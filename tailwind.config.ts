import type { Config } from 'tailwindcss';

// Rampa de marca ligada às CSS vars da direção ativa (violet/indigo/purple/fuchsia
// apontam todas para Clay). Famílias semânticas (emerald/amber/rose/teal/blue) intactas.
const brandRamp = {
  50: 'rgb(var(--brand-50) / <alpha-value>)',
  100: 'rgb(var(--brand-100) / <alpha-value>)',
  200: 'rgb(var(--brand-200) / <alpha-value>)',
  300: 'rgb(var(--brand-300) / <alpha-value>)',
  400: 'rgb(var(--brand-400) / <alpha-value>)',
  500: 'rgb(var(--brand-500) / <alpha-value>)',
  600: 'rgb(var(--brand-600) / <alpha-value>)',
  700: 'rgb(var(--brand-700) / <alpha-value>)',
  800: 'rgb(var(--brand-800) / <alpha-value>)',
  900: 'rgb(var(--brand-900) / <alpha-value>)',
  950: 'rgb(var(--brand-900) / <alpha-value>)',
};

// Rampa NEUTRA quente, config-driven via --n-* (injetadas pelo layout a partir da
// direção ativa). Fallback embebido na var() = neutros quentes "stone" aplicam-se
// SEMPRE, mesmo sem injeção (sem risco de cor inválida). slate/gray/zinc/neutral
// passam todas a seguir esta rampa → fim do navy/cinza-azulado frio em todo o site.
const neutralRamp = {
  50: 'rgb(var(--n-50, 250 249 246) / <alpha-value>)',
  100: 'rgb(var(--n-100, 245 243 239) / <alpha-value>)',
  200: 'rgb(var(--n-200, 232 228 222) / <alpha-value>)',
  300: 'rgb(var(--n-300, 215 210 202) / <alpha-value>)',
  400: 'rgb(var(--n-400, 168 161 151) / <alpha-value>)',
  500: 'rgb(var(--n-500, 121 114 104) / <alpha-value>)',
  600: 'rgb(var(--n-600, 88 82 74) / <alpha-value>)',
  700: 'rgb(var(--n-700, 66 61 55) / <alpha-value>)',
  800: 'rgb(var(--n-800, 41 37 33) / <alpha-value>)',
  900: 'rgb(var(--n-900, 28 25 22) / <alpha-value>)',
  950: 'rgb(var(--n-950, 14 12 10) / <alpha-value>)',
};

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: brandRamp,
        violet: brandRamp,
        indigo: brandRamp,
        purple: brandRamp,
        fuchsia: brandRamp,
        slate: neutralRamp,
        gray: neutralRamp,
        zinc: neutralRamp,
        neutral: neutralRamp,
        accent: 'var(--accent)',
        'accent-bright': 'var(--accent-bright)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-num)', 'ui-monospace', 'monospace'],
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
            color: 'var(--ink-2)',
            '--tw-prose-headings': 'var(--ink)',
            '--tw-prose-bold': 'var(--ink)',
            '--tw-prose-links': 'var(--accent)',
            '--tw-prose-quote-borders': 'var(--accent)',
            fontSize: '1rem',
            lineHeight: '1.7',
            h1: { fontFamily: 'var(--font-display)', fontWeight: '800', letterSpacing: '-0.02em' },
            h2: { fontFamily: 'var(--font-display)', fontWeight: '700', letterSpacing: '-0.01em', marginTop: '2.5em', marginBottom: '0.75em' },
            h3: { fontFamily: 'var(--font-display)', fontWeight: '600', marginTop: '1.8em', marginBottom: '0.5em' },
            h4: { fontFamily: 'var(--font-display)', fontWeight: '600' },
            p: { marginTop: '1em', marginBottom: '1em' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
