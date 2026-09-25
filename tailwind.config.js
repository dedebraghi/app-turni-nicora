/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nicora: {
          orange: {
            DEFAULT: '#ea580c', // Terracotta Artisan
            hover: '#cf4b07',
            light: '#fdf3ee',   // Terracotta Soft Accent
            border: '#edd9cd',  // Border Warm
          },
          teal: {
            DEFAULT: '#0a474b', // Deep Botanical Teal
            dark: '#002f32',    // Primary Deep Forest
            hover: '#072e31',
            light: '#e6f0eb',   // Botanical Container Low
            border: '#80b4b9',
          },
          sage: {
            DEFAULT: '#8a9a86', // Muted Sage
            light: '#f4f6f4',   // Surface Tinted
            border: '#e2e8e4',  // Border Sage
          },
          bg: '#fbfbf9',        // Canvas Cream Base
          surface: '#f2fcf7',   // Surface Bright
          card: '#ffffff',      // Pure White Card
          title: '#002f32',     // Titoli principali (Botanical Deep)
          text: '#242d2a',      // Charcoal Foliage per lettura ottima
          muted: '#707979',     // Outline / Muted
          border: '#e2e8e4',    // Border Sage
        }
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem', // 8px (base Botanica Nobile)
        'sm': '0.25rem',
        'md': '0.75rem',
        'lg': '1rem',      // 16px (Card curvature)
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'clean': '0 2px 6px -1px rgba(10, 71, 75, 0.04), 0 8px 24px -4px rgba(10, 71, 75, 0.06)',
        'elevated': '0 8px 24px -4px rgba(10, 71, 75, 0.08), 0 2px 6px -1px rgba(10, 71, 75, 0.04)',
        'modal': '0 20px 35px -8px rgba(10, 71, 75, 0.14)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      }
    },
  },
  plugins: [],
}

