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
            DEFAULT: '#E75113', // Orange Garden / Terra cotta
            hover: '#D0440B',
            light: '#FDF1EC',
            border: '#F6B79F',
          },
          teal: {
            DEFAULT: '#035F64', // Deep Teal Bosco
            hover: '#024A4E',
            light: '#E6F1F2',
            border: '#9DC4C6',
          },
          bg: '#F5F5F5',       // Sfondo generale dell'app
          card: '#FFFFFF',     // Card e modali
          title: '#1A1A1A',    // Titoli
          text: '#333333',     // Testo corpo
          muted: '#666666',    // Sottotitoli e icone inattive
          border: '#E8E8E8',   // Bordi leggeri
        }
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        'lg': '8px',
      },
      boxShadow: {
        'clean': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'modal': '0 -4px 20px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      }
    },
  },
  plugins: [],
}

