/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Japanese Café Warm Palette
        warm: {
          50: '#FDFBF7',  // Main background (soft off-white)
          100: '#F5F0E6', // Secondary background (warm beige)
          200: '#E6DCC8', // Borders, dividers
        },
        primary: {
          DEFAULT: '#A65E44', // Terracotta / Warm Clay (Buttons, primary actions)
          dark: '#8A4B35',    // Hover states
        },
        accent: {
          DEFAULT: '#6B7A53', // Muted Matcha Green (Success, stock available)
          dark: '#556142',    // Hover states
        },
        text: {
          main: '#2C2A29',    // Deep charcoal (Main text, softer than pure black)
          muted: '#7A7571',   // Secondary text, descriptions
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(166, 94, 68, 0.08)', // Soft, warm shadow for cards
      }
    },
  },
  plugins: [],
}