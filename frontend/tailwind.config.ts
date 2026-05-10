import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F5F1',
          100: '#CCE9E2',
          200: '#99D4C5',
          300: '#66BEA8',
          400: '#2D9B82',
          500: '#1A6B5A',
          600: '#155A4B',
          700: '#10493C',
          800: '#0B382E',
          900: '#06271F',
        },
        accent: {
          50: '#FEF3DC',
          100: '#FDE7B9',
          200: '#FBCF73',
          300: '#F9B72D',
          400: '#F5A623',
          500: '#D4901E',
          600: '#B07D10',
          700: '#8C6200',
          800: '#684A00',
          900: '#443100',
        },
        danger: {
          50: '#FDECEA',
          100: '#FAC8C4',
          200: '#F5918A',
          300: '#E86A5F',
          400: '#E04B3A',
          500: '#C62828',
          600: '#A31F1F',
          700: '#801717',
          800: '#5D0F0F',
          900: '#3A0808',
        },
        surface: '#FFFFFF',
        background: '#FAFAF8',
        muted: '#9A9AA8',
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        lg: '16px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-bounce': 'scaleBounce 0.3s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
