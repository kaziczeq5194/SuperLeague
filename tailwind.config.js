import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // League of Legends Dark Theme Palette
        league: {
          // Backgrounds
          'bg-darkest': '#010A13',
          'bg-dark': '#0A1428',
          'bg-medium': '#0A0E14',
          
          // Surfaces / Cards
          'surface': '#1E2328',
          'surface-light': '#1E282D',
          'surface-hover': '#252C32',
          
          // Primary Gold
          'gold': '#C89B3C',
          'gold-light': '#F0E6D2',
          'gold-dark': '#785A28',
          'gold-muted': '#463714',
          
          // Hextech Blue / Accent
          'blue': '#0AC8B9',
          'blue-dark': '#0397AB',
          'blue-muted': '#0A323C',
          
          // Text
          'text-primary': '#F0E6D2',
          'text-secondary': '#A09B8C',
          'text-muted': '#5B5A56',
          
          // Borders
          'border': '#785A28',
          'border-dark': '#463714',
          'border-subtle': '#1E282D',
          
          // Status Colors
          'success': '#0ACE81',
          'danger': '#E84057',
          'warning': '#F0B232',
          'info': '#0AC8B9',
          
          // Rank Colors
          'iron': '#6B6B6B',
          'bronze': '#8C5A3C',
          'silver': '#9AA4AF',
          'platinum': '#4E9996',
          'emerald': '#0ACE81',
          'diamond': '#576BCE',
          'master': '#9D48E0',
          'grandmaster': '#E84057',
          'challenger': '#F4C874',
        },
      },
      fontFamily: {
        'display': ['Beaufort for LOL', 'serif'],
        'body': ['Spiegel', 'Inter', 'sans-serif'],
        'sans': ['Inter', 'Spiegel', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'league': '4px',
      },
      boxShadow: {
        'league': '0 0 10px rgba(200, 155, 60, 0.15)',
        'league-hover': '0 0 20px rgba(200, 155, 60, 0.25)',
        'league-glow': '0 0 15px rgba(10, 200, 185, 0.3)',
      },
      backgroundImage: {
        'league-gradient': 'linear-gradient(180deg, #0A1428 0%, #010A13 100%)',
        'gold-gradient': 'linear-gradient(180deg, #C89B3C 0%, #785A28 100%)',
        'blue-gradient': 'linear-gradient(180deg, #0AC8B9 0%, #0397AB 100%)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(200, 155, 60, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(200, 155, 60, 0.4)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(10, 200, 185, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(10, 200, 185, 0.4)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
  ],
}
