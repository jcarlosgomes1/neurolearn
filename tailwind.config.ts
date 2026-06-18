import type { Config } from 'tailwindcss';

// Rampa única ligada às CSS vars da direção de design ativa (injetadas pelo layout
// a partir de nl_design_directions). As famílias "de marca" (brand + violet/indigo/
// purple/fuchsia) apontam TODAS para a mesma rampa Clay — assim qualquer página
// (blog incluído) segue a direção ativa, sem cores hardcoded. Famílias semânticas
// (emerald/amber/rose/teal/blue…) ficam intactas de propósito.
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
