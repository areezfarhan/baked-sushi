/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Fredoka', 'sans-serif'],
        'body': ['Nunito', 'sans-serif'],
      },
      colors: {
        primary: '#A65E44',
        'primary-dark': '#8A4B35',
        'text-main': '#2C2A29',
        'text-muted': '#7A7571',
        warm: {
          50: '#FDFBF7',
          100: '#F5F0E6',
          200: '#E6DCC8',
        },
        accent: '#C49A6C',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(166, 94, 68, 0.1)',
      },
    },
  },
  plugins: [],
}