/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ACTIZO brand teal — primary accent #36BAB3
        brand: {
          50: '#f0fbfa',
          100: '#d6f4f1',
          200: '#b0e9e4',
          300: '#7dd8d1',
          400: '#4ec4bc',
          500: '#36bab3',
          600: '#2a9d97',
          700: '#267f7b',
          800: '#246664',
          900: '#225553',
          950: '#0f3433',
        },
        // semantic surface tokens (light defaults; dark via .dark utilities)
        surface: {
          base: '#f8fafc',
          card: '#ffffff',
          muted: '#f1f5f9',
        },
        ink: {
          DEFAULT: '#1f2937',
          soft: '#6b7280',
          faint: '#9ca3af',
        },
        line: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(16,24,40,0.04), 0 1px 3px 0 rgba(16,24,40,0.06)',
        card: '0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)',
        'card-hover': '0 12px 28px -8px rgba(16,24,40,0.16), 0 4px 10px -4px rgba(16,24,40,0.08)',
        glow: '0 0 0 1px rgba(54,186,179,0.25), 0 8px 24px -6px rgba(54,186,179,0.35)',
        'inner-soft': 'inset 0 1px 2px rgba(16,24,40,0.06)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #36bab3 0%, #2a9d97 100%)',
        'brand-radial': 'radial-gradient(1200px circle at 0% 0%, rgba(54,186,179,0.12), transparent 40%)',
        'mesh': 'radial-gradient(at 0% 0%, rgba(54,186,179,0.10) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(125,216,209,0.10) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(54,186,179,0.08) 0px, transparent 50%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(54,186,179,0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(54,186,179,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(54,186,179,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        float: 'float 4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
