/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Primary Teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        coral: {
          500: '#f43f5e',
          600: '#e11d48',
        },
        senior: {
          bg: '#fafaf9',
          card: '#ffffff',
          text: '#0c0a09',
          contrast: '#000000',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'senior': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 25px rgba(20, 184, 166, 0.35)',
      }
    },
  },
  plugins: [],
}
