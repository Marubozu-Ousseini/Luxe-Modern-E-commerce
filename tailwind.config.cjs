/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif']
      },
      colors: {
        porcelain: '#FAF8F5',
        bone: '#F2EEE8',
        charcoal: '#1C1C1C',
        slate: '#2A2A2A',
        taupe: '#8A7E72',
        sand: '#D8CFC4',
        accent: '#0078FF',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.06)'
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      maxWidth: {
        content: '1320px'
      },
    }
  },
  plugins: [],
};
