/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        museum: {
          bg: '#F5F0EB',
          surface: '#FFFFFF',
          text: '#2C2C2C',
          muted: '#6B6560',
          border: '#E5DFD8',
          gold: '#C9A96E',
          'gold-light': '#E8DCC8',
          red: '#D94F4F',
          orange: '#E8915A',
          blue: '#4A7BA7',
          green: '#5A9E6F',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
