import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe5ff', 200: '#bccfff', 300: '#93aeff',
          400: '#6b87ff', 500: '#5b6cff', 600: '#4753f0', 700: '#3a3fd6',
          800: '#3236aa', 900: '#2c2e85',
        },
        // Acento secundário canónico (um só) — usado com parcimónia
        accent: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b',
        },
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      // RAIO CANÓNICO — um sistema, não seis valores soltos
      borderRadius: {
        card: '1rem',      // cards (= rounded-2xl) — o raio canónico de superfície
        control: '0.625rem', // botões, inputs, badges (= rounded-[10px])
      },
      // ELEVAÇÃO canónica — quando usar cada uma é deliberado
      boxShadow: {
        e1: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        e2: '0 2px 8px -2px rgb(15 23 42 / 0.08), 0 4px 12px -2px rgb(15 23 42 / 0.06)',
        e3: '0 8px 24px -6px rgb(15 23 42 / 0.12), 0 12px 32px -8px rgb(15 23 42 / 0.10)',
      },
      // GRADIENTES DE MARCA nomeados — os 90 colapsam para estes 3 papéis
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #5b6cff 0%, #4753f0 100%)',
        'accent-grad': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'surface-grad': 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
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
            'p:first-of-type::first-letter': {
              fontSize: '3.5em', fontWeight: '700', float: 'left',
              lineHeight: '0.85', marginRight: '0.08em', marginTop: '0.05em', color: '#4753f0',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
