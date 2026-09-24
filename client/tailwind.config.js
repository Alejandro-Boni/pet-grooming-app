/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sistema de color propio: boutique de spa para mascotas — cálido y natural,
        // sin la paleta pastel genérica ni el clásico crema+terracota.
        pine: { DEFAULT: '#2C3B31', dark: '#1E291F' },
        linen: '#EDE7DA',
        cream: '#F7F4EC',
        ink: '#21261F',
        ochre: { DEFAULT: '#C98A3E', dark: '#A8712F' },
        clay: { DEFAULT: '#B1503A', light: '#F1DED8' },
        sage: '#A9B79E',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
