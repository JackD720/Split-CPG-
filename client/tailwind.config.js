/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, trustworthy palette
        'split': {
          50: '#fdf8f3',
          100: '#faeee1',
          200: '#f5d9bd',
          300: '#efc08e',
          400: '#e8a05d',
          500: '#e2843a', // Primary brand orange
          600: '#d46a29',
          700: '#b05223',
          800: '#8d4223',
          900: '#72381f',
          950: '#3d1b0e',
        },
        'forest': {
          50: '#f3f6f4',
          100: '#e1e9e3',
          200: '#c4d4c9',
          300: '#9db8a6',
          400: '#73977f',
          500: '#527a61',
          600: '#3f614c', // Secondary green
          700: '#344e3f',
          800: '#2c4035',
          900: '#26352d',
          950: '#131d18',
        },
        'cream': {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e6',
          300: '#f5e8d3',
          400: '#edd8b8',
          500: '#e2c59a',
        },
        'charcoal': {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#1a1a1a',
        }
      },
      fontFamily: {
        'display': ['Instrument Serif', 'Georgia', 'serif'],
        'sans': ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
