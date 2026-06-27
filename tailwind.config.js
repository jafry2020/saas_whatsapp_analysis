/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // All colors are driven by CSS variables (see index.css) so that the
      // active *mode* (friends / pro) and *theme* (light / dark) cascade
      // through every component without per-component conditionals.
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-2': 'rgb(var(--accent-2) / <alpha-value>)',
        'accent-3': 'rgb(var(--accent-3) / <alpha-value>)',
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        positive: 'rgb(var(--positive) / <alpha-value>)',
        negative: 'rgb(var(--negative) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Clash Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: { tightest: '-0.04em' },
      gridTemplateColumns: { 24: 'repeat(24, minmax(0, 1fr))' },
      borderRadius: {
        lg: '0.85rem',
        xl: '1.1rem',
        '2xl': '1.4rem',
        '3xl': '1.9rem',
        xl2: '1.5rem',
        '4xl': '2.4rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px -6px rgb(0 0 0 / 0.10)',
        // Claymorphism — values come from CSS vars so they adapt per mode/theme.
        card: 'var(--clay-lg)',
        pop: 'var(--clay-lg)',
        clay: 'var(--clay)',
        'clay-sm': 'var(--clay-sm)',
        'clay-inset': 'var(--clay-inset)',
        'clay-accent': 'var(--clay-accent)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.30), 0 10px 50px -10px rgb(var(--accent) / 0.40)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(.8)' }, '60%': { opacity: 1, transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '100%': { transform: 'translateX(200%)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up .5s cubic-bezier(.2,.7,.2,1) both',
        'scale-in': 'scale-in .35s cubic-bezier(.2,.7,.2,1) both',
        'pop-in': 'pop-in .5s cubic-bezier(.2,.8,.2,1) both',
        marquee: 'marquee 32s linear infinite',
        shimmer: 'shimmer 2.2s infinite',
      },
    },
  },
  plugins: [],
}
