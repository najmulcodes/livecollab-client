export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // DM Sans is loaded in index.html — use it as the default sans
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Syne', 'DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        'card':       '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)',
        'modal':      '0 24px 64px rgba(0,0,0,0.18)',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in':  'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideIn:  { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:   { from: { opacity: 0 },                                to: { opacity: 1 } },
        scaleIn:  { from: { transform: 'scale(0.95)', opacity: 0 },      to: { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
