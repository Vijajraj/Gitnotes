/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#eaf0f6',
          200: '#d0dfed',
          300: '#a7c5df',
          400: '#76a5cc',
          500: '#5388b7',
          600: '#406e9c',
          700: '#345980',
          800: '#2e4c6b',
          900: '#29415a',
          950: '#1b2a3c',
        }
      }
    },
  },
  plugins: [],
}
