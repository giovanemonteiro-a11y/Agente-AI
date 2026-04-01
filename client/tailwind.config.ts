import type { Config } from 'tailwindcss';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: Config = {
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        // Galaxy Future Design System
        galaxy: {
          blue: '#1A56DB',
          'blue-light': '#3B76F6',
          'blue-dark': '#1040B0',
          pink: '#E040FB',
          'pink-light': '#F06FFF',
          'pink-dark': '#B020D0',
          purple: '#7C3AED',
          cyan: '#06B6D4',
        },
        bg: {
          deep: '#0A0A14',
          dark: '#0E0E1C',
          card: 'rgba(255, 255, 255, 0.04)',
          'card-hover': 'rgba(255, 255, 255, 0.08)',
        },
        glass: {
          border: 'rgba(255, 255, 255, 0.10)',
          'border-strong': 'rgba(255, 255, 255, 0.18)',
          surface: 'rgba(255, 255, 255, 0.06)',
          'surface-strong': 'rgba(255, 255, 255, 0.10)',
        },
        text: {
          primary: '#F0F0FF',
          secondary: '#A0A0C0',
          muted: '#606080',
          accent: '#1A56DB',
          pink: '#E040FB',
        },
      },
      backgroundImage: {
        'gradient-galaxy': 'linear-gradient(135deg, #1A56DB 0%, #7C3AED 50%, #E040FB 100%)',
        'gradient-galaxy-dark': 'linear-gradient(135deg, #0E1A40 0%, #1A0A30 50%, #2A0A3A 100%)',
        'gradient-blue-pink': 'linear-gradient(90deg, #1A56DB 0%, #E040FB 100%)',
        'gradient-blue-purple': 'linear-gradient(90deg, #1A56DB 0%, #7C3AED 100%)',
        'gradient-radial-blue': 'radial-gradient(ellipse at top left, rgba(26,86,219,0.3) 0%, transparent 60%)',
        'gradient-radial-pink': 'radial-gradient(ellipse at bottom right, rgba(224,64,251,0.2) 0%, transparent 60%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0A0A14 0%, #0E0820 100%)',
        'mesh-galaxy': `
          radial-gradient(ellipse at 20% 50%, rgba(26,86,219,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(224,64,251,0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.10) 0%, transparent 50%),
          linear-gradient(180deg, #0A0A14 0%, #0C0A18 100%)
        `,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(26, 86, 219, 0.5), 0 0 60px rgba(26, 86, 219, 0.2)',
        'glow-blue-sm': '0 0 10px rgba(26, 86, 219, 0.4)',
        'glow-pink': '0 0 20px rgba(224, 64, 251, 0.5), 0 0 60px rgba(224, 64, 251, 0.2)',
        'glow-pink-sm': '0 0 10px rgba(224, 64, 251, 0.4)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '4px',
        glass: '20px',
        'glass-lg': '40px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'glow-pulse-pink': 'glow-pulse-pink 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'thinking': 'thinking 1.4s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(26, 86, 219, 0.3), 0 0 30px rgba(26, 86, 219, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(26, 86, 219, 0.6), 0 0 60px rgba(26, 86, 219, 0.3)',
          },
        },
        'glow-pulse-pink': {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(224, 64, 251, 0.3), 0 0 30px rgba(224, 64, 251, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(224, 64, 251, 0.6), 0 0 60px rgba(224, 64, 251, 0.3)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'thinking': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
