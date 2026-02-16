/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'goldman': ['Goldman', 'cursive'],
      },
      colors: {
        navy: {
          DEFAULT: '#0A192F',
          light: '#112240',
          dark: '#020C1B',
        },
        sky: {
          DEFAULT: '#64FFDA',
          dark: '#4ECCA3',
        },
        grey: {
          DEFAULT: '#8892B0',
          light: '#CCD6F6',
        }
      },
      fontWeight: {
        thin: '300',
        normal: '400',
        medium: '500',
        bold: '700',
        black: '900',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
