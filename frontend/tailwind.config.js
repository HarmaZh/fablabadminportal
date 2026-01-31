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
          50: '#F0F7FA',
          100: '#E0EFF5',
          200: '#BCD4DE',
          300: '#A5CCD1',
          400: '#A0B9BF',
          500: '#9DACB2',
          600: '#7A8A90',
          700: '#5C6A70',
          800: '#434E54',
          900: '#2D3142',
        },
        background: '#FCFFF7',
        surface: '#FFFFFF',
        dark: '#2D3142',
      },
    },
  },
  plugins: [],
}
