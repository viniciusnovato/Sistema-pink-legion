/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Rose Gold Palette (compartilhada com Web)
        'rose-gold': {
          50: '#FDF2F3',
          100: '#FCE7E9',
          200: '#F9D2D7',
          300: '#F4B4BC',
          400: '#E8B4B8',  // Primary
          500: '#D4A5A9',  // Hover
          600: '#C09599',  // Active
          700: '#A67B80',
          800: '#8B6367',
          900: '#6F4E52',
        },
        // Background Colors
        'bg-light': '#FFFFFF',
        'bg-light-surface': '#F8F9FA',
        'bg-dark': '#0F0F0F',
        'bg-dark-surface': '#1A1A1A',
        // Text Colors
        'text-light-primary': '#1A1A1A',
        'text-light-secondary': '#6B7280',
        'text-dark-primary': '#FFFFFF',
        'text-dark-secondary': '#9CA3AF',
        // Border Colors
        'border-light': '#E5E7EB',
        'border-dark': '#374151',
      },
    },
  },
  plugins: [],
}