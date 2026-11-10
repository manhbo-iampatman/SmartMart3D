/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'sans-serif'],
        num: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        hyper: {
          ink: "#0f172a",
          surface: "#f8fafc",
          primary: "#0052cc",
          "primary-hover": "#0040a8",
          accent: "#ff5400",
          "accent-hover": "#e04800",
          fresh: "#10b981",
          "fresh-hover": "#059669",
          border: "#e2e8f0",
          card: "#ffffff",
        },
        brand: {
          blue: "#0052cc",
          yellow: "#ff5400",
          dark: "#0f172a",
        }
      }
    },
  },
  plugins: [],
}

