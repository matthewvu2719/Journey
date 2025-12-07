# Theming System Guide

## Overview
The app now supports multiple color themes that can be switched dynamically. All themes are defined in `src/themes.js` and use CSS variables for easy customization.

## How It Works

### 1. Theme Definition (`src/themes.js`)
Themes are defined as JavaScript objects with color properties:

```javascript
export const themes = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#1A1A1A',
      foreground: '#F9F5F2',
      accent: '#F9F5F2',
      // ... more colors
    }
  },
  // ... more themes
}
```

### 2. CSS Variables (`src/index.css`)
Colors are applied via CSS variables:

```css
:root {
  --color-background: #1A1A1A;
  --color-foreground: #F9F5F2;
  /* ... more variables */
}
```

### 3. Tailwind Integration (`tailwind.config.js`)
Tailwind classes reference the CSS variables:

```javascript
colors: {
  dark: 'var(--color-background)',
  light: 'var(--color-foreground)',
  // ... more colors
}
```

## Available Themes

1. **Dark** (default) - Original dark theme
2. **Light** - Light mode with inverted colors
3. **Ocean Blue** - Blue-tinted dark theme
4. **Purple Haze** - Purple-tinted dark theme
5. **Forest Green** - Green-tinted dark theme
6. **Warm Sunset** - Orange/warm-tinted theme

## Adding a New Theme

1. Open `src/themes.js`
2. Add a new theme object:

```javascript
export const themes = {
  // ... existing themes
  
  myNewTheme: {
    name: 'My New Theme',
    colors: {
      background: '#YOUR_BG_COLOR',
      backgroundDarker: '#YOUR_DARKER_BG',
      foreground: '#YOUR_TEXT_COLOR',
      foregroundSecondary: '#YOUR_SECONDARY_TEXT',
      accent: '#YOUR_ACCENT_COLOR',
      accentHover: '#YOUR_ACCENT_HOVER',
      border: 'rgba(R, G, B, 0.1)',
      glass: 'rgba(R, G, B, 0.05)',
    }
  }
}
```

3. The theme will automatically appear in the theme selector!

## Using Themes in Components

### Option 1: Use Tailwind Classes (Recommended)
```jsx
<div className="bg-dark text-light">
  <h1 className="text-accent">Hello</h1>
</div>
```

### Option 2: Use CSS Variables Directly
```jsx
<div style={{ 
  background: 'var(--color-background)',
  color: 'var(--color-foreground)' 
}}>
  Content
</div>
```

### Option 3: Use in CSS Files
```css
.my-component {
  background: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
}
```

## Theme Switching

### Programmatically
```javascript
import { applyTheme } from './themes'

// Switch to a theme
applyTheme('blue')
```

### Via UI
Users can click the theme selector button in the navigation bar to choose a theme. The selection is saved to localStorage and persists across sessions.

## Color Variables Reference

| Variable | Usage |
|----------|-------|
| `--color-background` | Main background color |
| `--color-background-darker` | Darker background for contrast |
| `--color-foreground` | Main text color |
| `--color-foreground-secondary` | Secondary text color |
| `--color-accent` | Accent/highlight color |
| `--color-accent-hover` | Accent hover state |
| `--color-border` | Border color (with opacity) |
| `--color-glass` | Glass effect background |

## Tailwind Class Reference

| Class | Maps To |
|-------|---------|
| `bg-dark` | `--color-background` |
| `bg-darker` | `--color-background-darker` |
| `text-light` | `--color-foreground` |
| `text-light-secondary` | `--color-foreground-secondary` |
| `text-accent` | `--color-accent` |
| `border-light/20` | Foreground with 20% opacity |

## Tips

1. **Always use theme variables** instead of hardcoded colors
2. **Test all themes** when adding new components
3. **Use opacity modifiers** (e.g., `text-light/60`) for subtle variations
4. **Keep contrast ratios** accessible (WCAG AA minimum)
5. **Glass effect** automatically adapts to theme colors

## Troubleshooting

**Theme not applying?**
- Check that `initializeTheme()` is called in `main.jsx`
- Clear localStorage: `localStorage.removeItem('habit_coach_theme')`

**Colors not updating?**
- Ensure you're using CSS variables or Tailwind classes
- Avoid hardcoded hex colors in components

**New theme not showing?**
- Verify the theme is added to the `themes` object in `themes.js`
- Check browser console for errors
