/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-garamond)', 'serif'],
      },
      colors: {
        parchment: {
          light: '#F5E6D3',
          DEFAULT: '#EDE0C8',
          dark: '#DBC1A7',
        },
        gold: {
          light: '#FFD700',
          DEFAULT: '#CFB53B',
          dark: '#B8860B',
        },
        burgundy: {
          light: '#9E2B25',
          DEFAULT: '#800020',
          dark: '#4A0404',
        },
        forest: {
          light: '#2D5A27',
          DEFAULT: '#1B4D3E',
          dark: '#0F362D',
        },
        ink: {
          light: '#2C3E50',
          DEFAULT: '#2C3E50',
          dark: '#1A252F',
        }
      },
      backgroundImage: {
        'parchment-texture': "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.08\"/%3E%3C/svg%3E')",
      },
      boxShadow: {
        'wax-seal': '0 4px 6px -1px rgba(128, 0, 32, 0.3), 0 2px 4px -1px rgba(128, 0, 32, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-in',
        'seal-press': 'sealPress 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        sealPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        }
      },
    },
  },
  plugins: [],
}
