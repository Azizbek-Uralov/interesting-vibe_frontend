/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System: Warm Latte / Cream / Espresso
        brand: {
          50: '#FDFBF9',
          100: '#FAF4EE',
          200: '#F4E7DA',
          300: '#E4CBB5',
          400: '#B58862',
          500: '#8B5E3C', // Primary Accent (Warm Latte / Caramel)
          600: '#6E472B', // Hover / Active (Deep Latte)
          700: '#543620',
          800: '#3D2717',
          900: '#2C221E', // Primary Text (Deep Espresso)
        },
        vibe: {
          bg: '#FAF7F2',         // Main background (Cream)
          surface: '#FFFFFF',    // White card / panel
          card: '#FFFFFF',       // Card surface
          cardAlt: '#F4EFE6',    // Darker cream card surface
          dark: '#2C221E',       // Primary Text (Deep Espresso)
          taupe: '#8C7A6B',      // Secondary Text (Taupe)
          latte: '#8B5E3C',      // Primary Accent Button
          latteHover: '#6E472B', // Primary Button Hover
          beige: '#EFE7DD',      // Secondary Button / Tag
          border: '#E6DEC3',     // Border / Divider
          borderLight: '#EAE3D2',// Light Divider
          danger: '#C85A5A',     // Danger / Alert
        },
      },
      borderRadius: {
        'pill': '50px',
        'card': '18px',
        'card-lg': '24px',
        'modal': '28px',
      },
      boxShadow: {
        'vibe-soft': '0 4px 20px -2px rgba(44, 34, 30, 0.05)',
        'vibe-card': '0 8px 30px -4px rgba(44, 34, 30, 0.08)',
        'vibe-hover': '0 12px 35px -4px rgba(139, 94, 60, 0.15)',
      },
    },
  },
  plugins: [],
}
