/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#009688',
          light: '#33ab9f',
          dark: '#006b61',
        },
        secondary: {
          DEFAULT: '#00C896',
          light: '#33d3ab',
          dark: '#008e6a',
        },
        dark: {
          DEFAULT: '#063B44',
          light: '#1e545d',
          dark: '#032025',
        },
        background: {
          DEFAULT: '#F8FCFC',
          card: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#FFD54F',
          light: '#ffdd72',
          dark: '#c7a41c',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(6, 59, 68, 0.05), 0 2px 8px -1px rgba(6, 59, 68, 0.03)',
        hover: '0 10px 25px -5px rgba(6, 59, 68, 0.1), 0 8px 16px -4px rgba(6, 59, 68, 0.05)',
        premium: '0 20px 40px -10px rgba(6, 59, 68, 0.08)',
      }
    },
  },
  plugins: [],
}
