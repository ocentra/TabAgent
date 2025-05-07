/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["src/**/*.{html,js}"],
  safelist: [
    'dark',
    'dark:bg-gray-800',
    'border-red-500',
    'bg-amber-100',
    'dark:bg-amber-700',
    'text-amber-700',
    'dark:text-amber-200',
    'border-amber-400',
    'dark:border-amber-600'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} 