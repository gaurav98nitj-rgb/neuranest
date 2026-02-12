/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EBF5FB', 100: '#D6EAF8', 200: '#AED6F1', 300: '#85C1E9',
          400: '#5DADE2', 500: '#2E86C1', 600: '#2874A6', 700: '#1B4F72',
          800: '#154360', 900: '#0E2F44',
        },
        surface: {
          DEFAULT: '#0E2F44',  // main bg (brand-900)
          1: '#133B55',        // card bg
          2: '#184A68',        // card hover / elevated
          3: '#1D5A7C',        // active / selected
        },
        line: {
          DEFAULT: '#1E5570',  // borders
          light: '#245F7A',    // hover borders
        },
      },
    },
  },
  plugins: [],
}
