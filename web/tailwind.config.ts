import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#1a1a1a',
          surface: '#242424',
          card: '#2a2a2a',
          border: '#333333',
          orange: '#FF6B00',
          'orange-hover': '#E55A00',
          'orange-light': '#FF8C33',
          muted: '#888888',
          text: '#F0F0F0',
          'text-secondary': '#AAAAAA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF6B00 0%, #E55A00 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
