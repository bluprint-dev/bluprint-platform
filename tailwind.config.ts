import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'headline': ['var(--font-space)', 'sans-serif'],
        'body': ['var(--font-inter)', 'sans-serif'],
        'mono-accent': ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // OKLCH Premium Whale Theme Colors
        'whale': {
          primary: 'oklch(42.4% 0.199 265.638)',      // Koyu Mavi
          secondary: 'oklch(14.1% 0.005 285.823)',    // Koyu Mor/Siyah
          tertiary: 'oklch(25% 0.1 265)',             // Orta Mavi
          accent: 'oklch(62.7% 0.194 149.214)',       // Teal/Yeşil
          accentPurple: 'oklch(55.8% 0.288 302.321)', // Mor
          text: 'oklch(98.4% 0.003 247.858)',         // Beyaz
          textSecondary: 'oklch(70% 0.015 260)',      // Açık Gri
          border: 'oklch(35% 0.05 265)',              // Border
          deep: 'oklch(10% 0.005 285)',               // En Koyu
        },
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.33%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px oklch(62.7% 0.194 149.214)' },
          '100%': { boxShadow: '0 0 20px oklch(62.7% 0.194 149.214)' },
        },
      },
    },
  },
  plugins: [],
}

export default config