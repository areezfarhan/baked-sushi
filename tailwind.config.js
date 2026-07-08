/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'script': ['Dancing Script', 'cursive'],
        'body': ['Lato', 'sans-serif'],
      },
      colors: {
        // Primary colors from logo
        primary: '#2D4A3E',        // Forest green (main text/buttons)
        'primary-dark': '#1E3A2E', // Darker forest green (hover)
        'primary-light': '#3D5A4E', // Lighter forest green
        
        // Gold accents
        accent: '#B8984A',          // Antique gold (main accent)
        'accent-light': '#D4B87A',  // Soft gold (highlights)
        'accent-dark': '#9A7F3A',   // Darker gold (hover)
        
        // Warm backgrounds
        warm: {
          50: '#FDFBF7',    // Warmest cream
          100: '#FAF6F0',   // Cream (main background)
          200: '#F5F0E6',   // Slightly darker cream
          300: '#F0EBE0',   // Card backgrounds
          400: '#E6DCC8',   // Borders
        },
        
        // Wood tones
        wood: {
          light: '#D4C4B0',
          medium: '#B8A890',
          dark: '#8B7355',
        },
        
        // Text colors
        'text-main': '#2D4A3E',      // Forest green for headings
        'text-body': '#4A5F5A',      // Softer green for body
        'text-muted': '#7A8B85',     // Muted green-gray
        'text-light': '#9AABA5',     // Light muted
        
        // Status colors (adapted to theme)
        status: {
          pending: '#B8984A',        // Gold
          confirmed: '#2D4A3E',      // Forest green
          processing: '#C9A961',     // Warm amber
          completed: '#5A7A6E',      // Sage green
          rejected: '#B86B6B',       // Muted rose
          expired: '#8B7355',        // Wood brown
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(45, 74, 62, 0.1)',
        'warm': '0 4px 20px -2px rgba(184, 152, 74, 0.15)',
        'elevated': '0 8px 30px rgba(45, 74, 62, 0.12)',
      },
      backgroundImage: {
        'wood-texture': "url('/wood-texture.jpg')",
        'gradient-warm': 'linear-gradient(135deg, #FAF6F0 0%, #F5F0E6 100%)',
      },
    },
  },
  plugins: [],
}