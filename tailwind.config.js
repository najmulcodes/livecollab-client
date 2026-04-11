export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f5dca8',
          300: '#f0c070',
          400: '#e8a24a',
          500: '#d4882a',
          600: '#b87930',
          700: '#8f5c1e',
          800: '#6b4216',
          900: '#4a2e0e',
        },
        surface: {
          DEFAULT: '#0b0b0c',
          50:  '#1a1814',
          100: '#14120f',
          200: '#0f0e0b',
          300: '#0b0b0c',
        },
      },
      boxShadow: {
        'card':       '0 2px 8px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.2)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4), 0 0 1px rgba(232,162,74,0.1)',
        'modal':      '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,162,74,0.1)',
        'amber':      '0 8px 40px rgba(232,162,74,0.3)',
        'amber-sm':   '0 4px 20px rgba(232,162,74,0.2)',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in':  'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
      },
      backgroundImage: {
        'amber-gradient': 'linear-gradient(135deg, #f0c070 0%, #e8a24a 50%, #b87930 100%)',
        'dark-gradient':  'linear-gradient(180deg, #0b0b0c 0%, #14120f 100%)',
      },
    },
  },
  plugins: [],
};