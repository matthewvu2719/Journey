/**
 * Theme Configuration
 * Define multiple color themes that can be switched dynamically
 */

export const themes = {
  // Current dark theme (default)
  dark: {
    name: 'Dark',
    colors: {
      background: '#1A1A1A',
      backgroundDarker: '#0F0F0F',
      foreground: '#F9F5F2',
      foregroundSecondary: '#E5E1DE',
      accent: '#F9F5F2',
      accentHover: '#E5E1DE',
      border: 'rgba(249, 245, 242, 0.15)',
      glass: 'rgba(249, 245, 242, 0.08)',
    }
  },

  // Light theme
  light: {
    name: 'Light',
    colors: {
      background: '#F9F5F2',
      backgroundDarker: '#E5E1DE',
      foreground: '#1A1A1A',
      foregroundSecondary: '#2A2A2A',
      accent: '#1A1A1A',
      accentHover: '#2A2A2A',
      border: 'rgba(26, 26, 26, 0.15)',
      glass: 'rgba(26, 26, 26, 0.08)',
    }
  },

  // Blue theme
  blue: {
    name: 'Ocean Blue',
    colors: {
      background: '#0A1929',
      backgroundDarker: '#050D17',
      foreground: '#E3F2FD',
      foregroundSecondary: '#BBDEFB',
      accent: '#2196F3',
      accentHover: '#1976D2',
      border: 'rgba(33, 150, 243, 0.2)',
      glass: 'rgba(33, 150, 243, 0.1)',
    }
  },

  // Purple theme
  purple: {
    name: 'Purple Haze',
    colors: {
      background: '#1A0A2E',
      backgroundDarker: '#0F0520',
      foreground: '#F3E5F5',
      foregroundSecondary: '#E1BEE7',
      accent: '#9C27B0',
      accentHover: '#7B1FA2',
      border: 'rgba(156, 39, 176, 0.2)',
      glass: 'rgba(156, 39, 176, 0.1)',
    }
  },

  // Green theme
  green: {
    name: 'Forest Green',
    colors: {
      background: '#0D1B0D',
      backgroundDarker: '#060D06',
      foreground: '#E8F5E9',
      foregroundSecondary: '#C8E6C9',
      accent: '#4CAF50',
      accentHover: '#388E3C',
      border: 'rgba(76, 175, 80, 0.2)',
      glass: 'rgba(76, 175, 80, 0.1)',
    }
  },

  // Warm theme
  warm: {
    name: 'Warm Sunset',
    colors: {
      background: '#2C1810',
      backgroundDarker: '#1A0F08',
      foreground: '#FFF3E0',
      foregroundSecondary: '#FFE0B2',
      accent: '#FF9800',
      accentHover: '#F57C00',
      border: 'rgba(255, 152, 0, 0.2)',
      glass: 'rgba(255, 152, 0, 0.1)',
    }
  },

  // Pink theme
  pink: {
    name: 'Cute Pink',
    colors: {
      background: '#2D1520',
      backgroundDarker: '#1A0A12',
      foreground: '#FFE4F0',
      foregroundSecondary: '#FFCCE5',
      accent: '#FF69B4',
      accentHover: '#FF1493',
      border: 'rgba(255, 105, 180, 0.2)',
      glass: 'rgba(255, 105, 180, 0.1)',
    }
  },

  // Wes Anderson theme - Vibrant pastels and symmetrical colors
  wesanderson: {
    name: 'Wes Anderson',
    colors: {
      background: '#FFF4E6',
      backgroundDarker: '#FFE8CC',
      foreground: '#2C1810',
      foregroundSecondary: '#5C4033',
      accent: '#F4A6C8',
      accentHover: '#E88FB5',
      border: 'rgba(135, 206, 235, 0.3)',
      glass: 'rgba(244, 166, 200, 0.15)',
    }
  },

  // Wong Kar-wai theme - Dark moody with light neon green
  wongkarwai: {
    name: 'Wong Kar-wai',
    colors: {
      background: '#1A1A1A',
      backgroundDarker: '#0F0F0F',
      foreground: '#E8E8E8',
      foregroundSecondary: '#B8B8B8',
      accent: '#CFFFB1',
      accentHover: '#B8E89F',
      border: 'rgba(207, 255, 177, 0.25)',
      glass: 'rgba(207, 255, 177, 0.1)',
    }
  },
}

/**
 * Apply theme to the document
 * @param {string} themeName - Name of the theme from themes object
 */
export function applyTheme(themeName) {
  const theme = themes[themeName]
  if (!theme) {
    console.error(`Theme "${themeName}" not found`)
    return
  }

  const root = document.documentElement
  const colors = theme.colors

  // Helper to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null
  }

  // Set CSS variables
  root.style.setProperty('--color-background', colors.background)
  root.style.setProperty('--color-background-darker', colors.backgroundDarker)
  root.style.setProperty('--color-foreground', colors.foreground)
  root.style.setProperty('--color-foreground-secondary', colors.foregroundSecondary)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-accent-hover', colors.accentHover)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-glass', colors.glass)
  
  // Set RGB values for opacity usage
  root.style.setProperty('--color-foreground-rgb', hexToRgb(colors.foreground))
  root.style.setProperty('--color-background-rgb', hexToRgb(colors.background))

  // Save to localStorage
  localStorage.setItem('habit_coach_theme', themeName)
}

/**
 * Get current theme from localStorage or default to 'dark'
 */
export function getCurrentTheme() {
  return localStorage.getItem('habit_coach_theme') || 'dark'
}

/**
 * Initialize theme on app load
 */
export function initializeTheme() {
  const currentTheme = getCurrentTheme()
  applyTheme(currentTheme)
}
