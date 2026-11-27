/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mascotarey: {
          black: '#0F0F0F',
          blackSoft: '#141414',
          gold: '#D4AF37',
          goldSoft: '#E5C158',
          goldDeep: '#A87C1F',
          cream: '#F7F1E3',
          ivory: '#FFFDF9',
          white: '#FFFFFF',
          champagne: '#F1E5C5',
          glass: 'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(212,175,55,0.45), 0 12px 30px rgba(212,175,55,0.18)',
        glow: '0 0 20px rgba(229,193,88,0.35)',
      },
      backgroundImage: {
        'gold-radial': 'radial-gradient(circle at top, rgba(229,193,88,0.35), transparent 45%)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};