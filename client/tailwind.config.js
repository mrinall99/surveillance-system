/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        // Core backgrounds
        bg: {
          deep: '#060b18',
          base: '#0b1225',
          surface: '#0f1a30',
          card: '#111d38',
          elevated: '#162040',
        },
        // Borders
        border: {
          subtle: '#1a2a4a',
          DEFAULT: '#1e3152',
          glow: '#00d4ff40',
        },
        // Primary cyan
        cyber: {
          50: '#e0faff',
          100: '#b0f3ff',
          200: '#80ebff',
          300: '#40e0ff',
          400: '#00d4ff',
          500: '#00b8d9',
          600: '#0095b3',
          700: '#007285',
          800: '#004e5a',
          900: '#002a30',
        },
        // Violet accent
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        // Threat levels
        threat: {
          critical: '#ff3a3a',
          high: '#ff9500',
          medium: '#ffd60a',
          low: '#00e676',
        },
        // Legacy command palette (backwards compat)
        command: {
          bg: '#060b18',
          card: '#0f1a30',
          border: '#1e3152',
          text: '#f0f6ff',
          subtext: '#7a9cc0',
          primary: '#00d4ff',
          primaryHover: '#00b8d9',
          accent: '#7c3aed',
          danger: '#ff3a3a',
          warning: '#ff9500',
          success: '#00e676',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.15)',
        'neon-cyan-sm': '0 0 10px rgba(0, 212, 255, 0.3)',
        'neon-red': '0 0 20px rgba(255, 58, 58, 0.5), 0 0 60px rgba(255, 58, 58, 0.2)',
        'neon-red-sm': '0 0 10px rgba(255, 58, 58, 0.35)',
        'neon-amber': '0 0 20px rgba(255, 149, 0, 0.4)',
        'neon-green': '0 0 20px rgba(0, 230, 118, 0.4)',
        'neon-violet': '0 0 20px rgba(124, 58, 237, 0.4)',
        'card-glow': '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 212, 255, 0.05)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(to right, #1e3152_18px_1px, transparent 1px), linear-gradient(to bottom, #1e3152_18px_1px, transparent 1px)',
        'cyber-grid-sm': 'linear-gradient(to right, #1e315214 1px, transparent 1px), linear-gradient(to bottom, #1e315214 1px, transparent 1px)',
        'neon-gradient': 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        'threat-gradient': 'linear-gradient(135deg, #ff3a3a, #ff9500)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,212,255,0.03) 100%)',
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'glow-border': 'glowBorder 3s ease-in-out infinite',
        'alert-pulse': 'alertPulse 1.5s infinite ease-in-out',
        'radar-sweep': 'radarSweep 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'fadeIn 0.5s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)' },
          '50%': { opacity: 0.8, boxShadow: '0 0 25px rgba(0, 212, 255, 0.7)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        glowBorder: {
          '0%, 100%': { borderColor: 'rgba(0, 212, 255, 0.3)' },
          '50%': { borderColor: 'rgba(0, 212, 255, 0.8)' },
        },
        alertPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 58, 58, 0.4)', borderColor: 'rgba(255, 58, 58, 0.8)' },
          '50%': { boxShadow: '0 0 35px rgba(255, 58, 58, 0.9)', borderColor: 'rgba(255, 58, 58, 1)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
