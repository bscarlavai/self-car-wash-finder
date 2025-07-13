/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'carwash-blue': {
          DEFAULT: '#18394B',
          50: '#e6ecf0',
          100: '#cdd9e1',
          200: '#9bb3c3',
          300: '#688da5',
          400: '#366787',
          500: '#18394B',
          600: '#133042',
          700: '#0e2638',
          800: '#091c2e',
          900: '#041224',
        },
        'carwash-light': {
          DEFAULT: '#7BA7BA',
          50: '#f2f7f9',
          100: '#e6eef3',
          200: '#c0d7e3',
          300: '#9ac0d3',
          400: '#74a9c3',
          500: '#7BA7BA',
          600: '#5e8a9a',
          700: '#46687a',
          800: '#33505a',
          900: '#22363a',
        },
        'hippie-blue': '#66A4B5',
        'tarawera': '#093146',
        'manatee': '#8C94A4',
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'soft-gradient': 'linear-gradient(135deg, #f8f7ff 0%, #fff7f3 50%, #f0fdfa 100%)',
        'hero-gradient': 'linear-gradient(135deg, #f8f7ff 0%, #ffe8d9 50%, #ccfbf1 100%)',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(139, 92, 246, 0.1)',
        'soft-hover': '0 8px 30px rgba(139, 92, 246, 0.15)',
      },
    },
  },
  plugins: [],
} 