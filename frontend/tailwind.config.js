/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors (automatically adapt to selected theme)
        // Using rgb() with <alpha-value> allows Tailwind opacity modifiers to work
        dark: ({ opacityValue }) => 
          opacityValue !== undefined 
            ? `rgba(var(--color-background-rgb), ${opacityValue})`
            : 'var(--color-background)',
        darker: 'var(--color-background-darker)',
        light: ({ opacityValue }) => 
          opacityValue !== undefined 
            ? `rgba(var(--color-foreground-rgb), ${opacityValue})`
            : 'var(--color-foreground)',
        'light-secondary': 'var(--color-foreground-secondary)',
        accent: 'var(--color-accent)',
        
        // Additional theme colors
        'theme-bg': 'var(--color-background)',
        'theme-bg-darker': 'var(--color-background-darker)',
        'theme-fg': 'var(--color-foreground)',
        'theme-fg-secondary': 'var(--color-foreground-secondary)',
        'theme-accent': 'var(--color-accent)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display': ['3.5rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.8s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
