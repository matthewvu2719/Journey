import { useState, useEffect } from 'react'
import { themes, applyTheme, getCurrentTheme } from '../themes'

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = (themeName) => {
    applyTheme(themeName)
    setCurrentTheme(themeName)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full glass-theme flex items-center justify-center hover-lift shadow-xl"
        title="Change Theme"
      >
        <svg className="w-6 h-6 text-theme-fg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {/* Theme Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute left-0 bottom-full mb-2 w-48 glass-theme rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              <div className="text-xs font-semibold text-theme-fg opacity-60 px-3 py-2 uppercase tracking-wider">
                Select Theme
              </div>
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    currentTheme === key
                      ? 'bg-theme-fg text-theme-bg font-semibold'
                      : 'text-theme-fg opacity-80 hover:bg-theme-fg hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{theme.name}</span>
                    {currentTheme === key && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
