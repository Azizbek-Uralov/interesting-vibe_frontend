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
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f98080',
          500: '#e60023', // Pinterest-like brand red
          600: '#cc001f',
          700: '#b0001a',
          800: '#910015',
          900: '#750011',
        },
      },
    },
  },
  plugins: [],
}

