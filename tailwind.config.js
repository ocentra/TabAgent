/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["src/**/*.{html,js}"],
  safelist: [
    'dark',
    'dark:bg-gray-800',
    'border-red-500'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} 