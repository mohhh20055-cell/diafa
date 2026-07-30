/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#152A54",
          deep: "#0E1E3D",
        },
        gold: {
          DEFAULT: "#CB9A56",
          soft: "#E4C48A",
        },
        cream: "#FAF7F1",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      direction: ["ltr", "rtl"],
    },
  },
  plugins: [],
};
