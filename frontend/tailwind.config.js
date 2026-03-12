/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom FabLab color palette from Coolors
        'pale-sky': '#BCD4DE',
        'light-blue': '#A5CCD1',
        'cool-steel': '#A0B9BF',
        'cool-gray': '#9DACB2',
        'steel-gray': '#949BA0',
        'jet-black': '#2D3142',
        'porcelain': '#FCFFF7',

        // Semantic color assignments
        primary: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        background: '#F8F9FC',
        surface: '#FFFFFF',
        dark: '#2D3142',
      },
    },
  },
  plugins: [],
}
