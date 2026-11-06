/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0071dc",
          yellow: "#ffc220",
          dark: "#0f172a",
        }
      }
    },
  },
  plugins: [],
}

