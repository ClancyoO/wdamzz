export default {
  content: [
    './src/pages/**/*.html',
    './src/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070f3',
        secondary: '#6c757d',
        dark: '#121212',
        'dark-light': '#1e1e1e',
        'dark-lighter': '#2d2d2d',
        'bg-primary': '#000000',
        'bg-card': '#121212',
        'bg-module': '#1e1e1e',
        'border-color': '#2d2d2d',
        'text-primary': '#ffffff',
        'text-secondary': '#6c757d',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#0ea5e9',
        brand: {
          blue: '#0070f3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
