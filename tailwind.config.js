/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Single, considered accent — a controlled royal blue.
        brand: {
          50: '#eff4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#6090fa',
          500: '#3b6df5',
          600: '#2450e8',
          700: '#1d3fd0',
          800: '#1e37a8',
          900: '#1e3485',
        },
        // Cool, consistent neutral family (single gray hue).
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#dfe3ea',
          300: '#c6ccd8',
          400: '#98a1b3',
          500: '#6b7488',
          600: '#4d5566',
          700: '#3a4152',
          800: '#242a37',
          900: '#161a23',
          950: '#0e1119',
        },
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(16 24 40 / 0.04)',
        'card': '0 1px 2px -1px rgb(16 24 40 / 0.06), 0 2px 6px -2px rgb(16 24 40 / 0.05)',
        'pop': '0 4px 12px -2px rgb(16 24 40 / 0.10), 0 12px 32px -8px rgb(16 24 40 / 0.14)',
        'focus': '0 0 0 3px rgb(59 109 245 / 0.18)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sheet-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'pop-in': 'pop-in 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-up': 'sheet-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
