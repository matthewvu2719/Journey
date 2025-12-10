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

  // Light 2 theme - Vibrant pastels and symmetrical colors
  light2: {
    name: 'Light 2',
    colors: {
      background: '#FFF4E6',
      backgroundDarker: '#FFE8CC',
      foreground: '#2C1810',
      foregroundSecondary: '#5C4033',
      accent: '#87CEEB',
      accentHover: '#6BB6D9',
      border: 'rgba(135, 206, 235, 0.3)',
      glass: 'rgba(135, 206, 235, 0.15)',
      accentPink: '#F4A6C8',
      accentYellow: '#F4D03F',
    }
  },

  // Dark 2 theme - Dark moody with light neon green
  dark2: {
    name: 'Dark 2',
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

  // Amethyst Haze theme - Soft purple and pink tones
  amethyst: {
    name: 'Amethyst Haze',
    colors: {
      background: '#f8f7fa',
      backgroundDarker: '#f1eff5',
      foreground: '#3d3c4f',
      foregroundSecondary: '#6b6880',
      accent: '#8a79ab',
      accentHover: '#a995c9',
      border: 'rgba(138, 121, 171, 0.2)',
      glass: 'rgba(138, 121, 171, 0.08)',
      accentPink: '#e6a5b8',
      accentGreen: '#77b8a1',
    }
  },

  // Amethyst Haze Dark theme
  amethystDark: {
    name: 'Amethyst Haze Dark',
    colors: {
      background: '#1a1823',
      backgroundDarker: '#16141e',
      foreground: '#e0ddef',
      foregroundSecondary: '#a09aad',
      accent: '#a995c9',
      accentHover: '#c0aee0',
      border: 'rgba(169, 149, 201, 0.2)',
      glass: 'rgba(169, 149, 201, 0.08)',
      accentPink: '#f2b8c6',
      accentGreen: '#77b8a1',
    }
  },

  // CandyLand theme - Bright and playful with pink, yellow, and blue
  candyland: {
    name: 'CandyLand',
    colors: {
      background: '#f7f9fa',
      backgroundDarker: '#e8eef0',
      foreground: '#333333',
      foregroundSecondary: '#6e6e6e',
      accent: '#ffc0cb',
      accentHover: '#ffb3c1',
      border: 'rgba(255, 192, 203, 0.3)',
      glass: 'rgba(255, 192, 203, 0.1)',
      accentYellow: '#ffff00',
      accentBlue: '#87ceeb',
      accentGreen: '#33cc33',
    }
  },

  // CandyLand Dark theme
  candylandDark: {
    name: 'CandyLand Dark',
    colors: {
      background: '#1a1d23',
      backgroundDarker: '#14161a',
      foreground: '#e5e5e5',
      foregroundSecondary: '#a3a3a3',
      accent: '#ff99cc',
      accentHover: '#ffb3d9',
      border: 'rgba(255, 153, 204, 0.3)',
      glass: 'rgba(255, 153, 204, 0.1)',
      accentYellow: '#ffff00',
      accentBlue: '#87ceeb',
      accentGreen: '#33cc33',
    }
  },

  // Kodama Grove theme - Earthy, natural tones inspired by forest spirits
  kodama: {
    name: 'Kodama Grove',
    colors: {
      background: '#e4d7b0',
      backgroundDarker: '#e2d1a2',
      foreground: '#5c4b3e',
      foregroundSecondary: '#85766a',
      accent: '#9db18c',
      accentHover: '#8a9f7b',
      border: 'rgba(157, 177, 140, 0.3)',
      glass: 'rgba(157, 177, 140, 0.1)',
      accentGold: '#dbc894',
      accentBrown: '#a18f5c',
    }
  },

  // Kodama Grove Dark theme
  kodamaDark: {
    name: 'Kodama Grove Dark',
    colors: {
      background: '#3a3529',
      backgroundDarker: '#2a2521',
      foreground: '#ede4d4',
      foregroundSecondary: '#a8a096',
      accent: '#8a9f7b',
      accentHover: '#9db18c',
      border: 'rgba(138, 159, 123, 0.3)',
      glass: 'rgba(138, 159, 123, 0.1)',
      accentGold: '#a18f5c',
      accentBrown: '#71856a',
    }
  },

  // Notebook theme - Simple, clean grayscale with handwritten feel
  notebook: {
    name: 'Notebook',
    colors: {
      background: '#f9f9f9',
      backgroundDarker: '#f0f0f0',
      foreground: '#3a3a3a',
      foregroundSecondary: '#505050',
      accent: '#606060',
      accentHover: '#4a4a4a',
      border: 'rgba(96, 96, 96, 0.2)',
      glass: 'rgba(96, 96, 96, 0.05)',
      accentPaper: '#f3eac8',
      accentGray: '#a0a0a0',
    }
  },

  // Notebook Dark theme
  notebookDark: {
    name: 'Notebook Dark',
    colors: {
      background: '#2b2b2b',
      backgroundDarker: '#212121',
      foreground: '#dcdcdc',
      foregroundSecondary: '#a0a0a0',
      accent: '#b0b0b0',
      accentHover: '#c0c0c0',
      border: 'rgba(176, 176, 176, 0.2)',
      glass: 'rgba(176, 176, 176, 0.05)',
      accentPaper: '#e0e0e0',
      accentGray: '#707070',
    }
  },

  // Mocha Mouse theme - Warm coffee and cream tones
  mocha: {
    name: 'Mocha Mouse',
    colors: {
      background: '#F1F0E5',
      backgroundDarker: '#ebd6cb',
      foreground: '#56453F',
      foregroundSecondary: '#8A655A',
      accent: '#A37764',
      accentHover: '#8A655A',
      border: 'rgba(163, 119, 100, 0.3)',
      glass: 'rgba(163, 119, 100, 0.1)',
      accentCream: '#E4C7B8',
      accentTan: '#BAAB92',
    }
  },

  // Mocha Mouse Dark theme
  mochaDark: {
    name: 'Mocha Mouse Dark',
    colors: {
      background: '#2d2521',
      backgroundDarker: '#1f1a17',
      foreground: '#F1F0E5',
      foregroundSecondary: '#c5aa9b',
      accent: '#C39E88',
      accentHover: '#BAAB92',
      border: 'rgba(195, 158, 136, 0.3)',
      glass: 'rgba(195, 158, 136, 0.1)',
      accentCream: '#E4C7B8',
      accentTan: '#A37764',
    }
  },

  // Vintage Paper theme - Aged paper with sepia tones
  vintage: {
    name: 'Vintage Paper',
    colors: {
      background: '#f5f1e6',
      backgroundDarker: '#ece5d8',
      foreground: '#4a3f35',
      foregroundSecondary: '#7d6b56',
      accent: '#a67c52',
      accentHover: '#8d6e4c',
      border: 'rgba(166, 124, 82, 0.3)',
      glass: 'rgba(166, 124, 82, 0.1)',
      accentBeige: '#d4c8aa',
      accentBrown: '#735a3a',
    }
  },

  // Vintage Paper Dark theme
  vintageDark: {
    name: 'Vintage Paper Dark',
    colors: {
      background: '#2d2621',
      backgroundDarker: '#1f1a17',
      foreground: '#ece5d8',
      foregroundSecondary: '#c5bcac',
      accent: '#c0a080',
      accentHover: '#b3906f',
      border: 'rgba(192, 160, 128, 0.3)',
      glass: 'rgba(192, 160, 128, 0.1)',
      accentBeige: '#a67c52',
      accentBrown: '#735a3a',
    }
  },

  // Haven theme - Calm, sophisticated with warm neutrals
  haven: {
    name: 'Haven',
    colors: {
      background: '#fdfcf9',
      backgroundDarker: '#f3eee4',
      foreground: '#0f1e38',
      foregroundSecondary: '#5a4d3c',
      accent: '#b89b76',
      accentHover: '#8a7457',
      border: 'rgba(184, 155, 118, 0.3)',
      glass: 'rgba(184, 155, 118, 0.1)',
      accentBeige: '#e9e4d9',
      accentNavy: '#18294d',
    }
  },

  // Haven Dark theme
  havenDark: {
    name: 'Haven Dark',
    colors: {
      background: '#000000',
      backgroundDarker: '#0f1e38',
      foreground: '#f5f1e6',
      foregroundSecondary: '#b8b4ab',
      accent: '#d8b98f',
      accentHover: '#b89b76',
      border: 'rgba(216, 185, 143, 0.3)',
      glass: 'rgba(216, 185, 143, 0.1)',
      accentBeige: '#3c352a',
      accentNavy: '#18294d',
    }
  },

  // Bubblegum theme - Sweet pink and blue pastels
  bubblegum: {
    name: 'Bubblegum',
    colors: {
      background: '#f6e6ee',
      backgroundDarker: '#f8d8ea',
      foreground: '#5b5b5b',
      foregroundSecondary: '#7a7a7a',
      accent: '#d04f99',
      accentHover: '#e670ab',
      border: 'rgba(208, 79, 153, 0.3)',
      glass: 'rgba(208, 79, 153, 0.1)',
      accentYellow: '#fbe2a7',
      accentBlue: '#84d2e2',
    }
  },

  // Bubblegum Dark theme
  bubblegumDark: {
    name: 'Bubblegum Dark',
    colors: {
      background: '#12242e',
      backgroundDarker: '#101f28',
      foreground: '#f3e3ea',
      foregroundSecondary: '#e4a2b1',
      accent: '#fbe2a7',
      accentHover: '#50afb6',
      border: 'rgba(251, 226, 167, 0.3)',
      glass: 'rgba(251, 226, 167, 0.1)',
      accentPink: '#c67b96',
      accentBlue: '#50afb6',
    }
  },

  // Retro Arcade theme - Vibrant Solarized-inspired colors
  retroArcade: {
    name: 'Retro Arcade',
    colors: {
      background: '#fdf6e3',
      backgroundDarker: '#eee8d5',
      foreground: '#073642',
      foregroundSecondary: '#586e75',
      accent: '#d33682',
      accentHover: '#cb4b16',
      border: 'rgba(211, 54, 130, 0.3)',
      glass: 'rgba(211, 54, 130, 0.1)',
      accentBlue: '#268bd2',
      accentCyan: '#2aa198',
    }
  },

  // Retro Arcade Dark theme
  retroArcadeDark: {
    name: 'Retro Arcade Dark',
    colors: {
      background: '#002b36',
      backgroundDarker: '#073642',
      foreground: '#93a1a1',
      foregroundSecondary: '#839496',
      accent: '#d33682',
      accentHover: '#cb4b16',
      border: 'rgba(211, 54, 130, 0.3)',
      glass: 'rgba(211, 54, 130, 0.1)',
      accentBlue: '#268bd2',
      accentCyan: '#2aa198',
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
