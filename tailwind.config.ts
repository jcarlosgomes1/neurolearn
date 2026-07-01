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

// Rampas SEMÂNTICAS config-driven (var --success/--warning/--danger/--info com fallback
// embebido = tom canónico). emerald/green/teal/lime→sucesso, amber/yellow/orange→aviso,
// rose/red→perigo, blue/sky/cyan→info. Muda-se num só sítio; sem editar os 312 ficheiros.
const sem = (n: string, f: Record<number, string>): Record<string, string> =>
  Object.fromEntries(
    ([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const).map((s) => [
      String(s),
      `rgb(var(--${n}-${s}, ${f[s]}) / <alpha-value>)`,
    ]),
  ) as Record<string, string>;

const successRamp = sem('success', { 50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183', 400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 700: '4 120 87', 800: '6 95 70', 900: '6 78 59', 950: '2 44 34' });
const warningRamp = sem('warning', { 50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15', 950: '69 26 3' });
const dangerRamp = sem('danger', { 50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55', 950: '76 5 25' });
const infoRamp = sem('info', { 50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138', 950: '23 37 84' });

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
        emerald: successRamp,
        green: successRamp,
        teal: successRamp,
        lime: successRamp,
        amber: warningRamp,
        yellow: warningRamp,
        orange: warningRamp,
        rose: dangerRamp,
        red: dangerRamp,
        blue: infoRamp,
        sky: infoRamp,
        cyan: infoRamp,
        pink: brandRamp,
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
