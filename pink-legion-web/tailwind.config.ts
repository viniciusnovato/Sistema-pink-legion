import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors - Rose Gold Palette
        primary: {
          50: '#FDF2F3',
          100: '#FCE7E9',
          200: '#F9D2D7',
          300: '#F4B4BC',
          400: '#E8B4B8',  // Main brand color
          500: '#D4A5A9',  // Hover state
          600: '#C09599',  // Active state
          700: '#A67B80',
          800: '#8B6367',
          900: '#6F4E52',
        },
        
        // Secondary Colors - Pink Accent
        secondary: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',  // Pink accent
          500: '#EC4899',  // Main pink
          600: '#DB2777',  // Hover pink
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },

        // Neutral Colors with Better Contrast
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },

        // Semantic Colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },

        // Background Colors
        background: {
          light: '#FFFFFF',
          'light-secondary': '#FAFAFA',
          'light-tertiary': '#F5F5F5',
          dark: '#0A0A0A',
          'dark-secondary': '#171717',
          'dark-tertiary': '#262626',
        },

        // Surface Colors (for cards, modals, etc.)
        surface: {
          light: '#FFFFFF',
          'light-elevated': '#FAFAFA',
          dark: '#171717',
          'dark-elevated': '#262626',
        },

        // Text Colors with High Contrast
        text: {
          'light-primary': '#0A0A0A',      // Very dark for high contrast
          'light-secondary': '#525252',    // Medium gray
          'light-tertiary': '#737373',     // Light gray
          'light-disabled': '#A3A3A3',     // Disabled state
          'dark-primary': '#FAFAFA',       // Very light for high contrast
          'dark-secondary': '#D4D4D4',     // Medium light gray
          'dark-tertiary': '#A3A3A3',      // Medium gray
          'dark-disabled': '#737373',      // Disabled state
        },

        // Border Colors
        border: {
          light: '#E5E5E5',
          'light-strong': '#D4D4D4',
          dark: '#404040',
          'dark-strong': '#525252',
        },

        // Legacy support (will be gradually removed)
        'rose-gold': {
          50: '#FDF2F3',
          100: '#FCE7E9',
          200: '#F9D2D7',
          300: '#F4B4BC',
          400: '#E8B4B8',
          500: '#D4A5A9',
          600: '#C09599',
          700: '#A67B80',
          800: '#8B6367',
          900: '#6F4E52',
        },
        'bg-light': '#FFFFFF',
        'bg-light-surface': '#F8F9FA',
        'bg-dark': '#0F0F0F',
        'bg-dark-surface': '#1A1A1A',
        'text-light-primary': '#0A0A0A',
        'text-light-secondary': '#525252',
        'text-dark-primary': '#FAFAFA',
        'text-dark-secondary': '#D4D4D4',
        'border-light': '#E5E5E5',
        'border-dark': '#404040',
      },
      
      // Enhanced spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Enhanced shadow system
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 32px 0 rgba(0, 0, 0, 0.16)',
        'glow': '0 0 20px rgba(244, 180, 188, 0.4)',
        'glow-dark': '0 0 20px rgba(244, 180, 188, 0.2)',
      },
      
      // Enhanced border radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
export default config;