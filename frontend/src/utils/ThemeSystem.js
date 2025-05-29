// Advanced Theme System for SYNC
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const themes = {
  cyber: {
    name: 'Cyberpunk',
    id: 'cyber',
    colors: {
      primary: '#8000ff',
      secondary: '#ff0080',
      accent: '#00ffff',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a1a 100%)',
      surface: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(128, 0, 255, 0.2)',
      text: '#ffffff',
      textSecondary: '#cccccc',
      success: '#00ff88',
      error: '#ff0044',
      warning: '#ffaa00'
    },
    effects: {
      glow: true,
      particles: true,
      scanlines: true,
      neon: true
    }
  },
  
  dark: {
    name: 'Dark Mode',
    id: 'dark',
    colors: {
      primary: '#6366f1',
      secondary: '#ec4899',
      accent: '#06b6d4',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
      surface: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(75, 85, 99, 0.5)',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b'
    },
    effects: {
      glow: false,
      particles: false,
      scanlines: false,
      neon: false
    }
  },
  
  light: {
    name: 'Light Mode',
    id: 'light',
    colors: {
      primary: '#7c3aed',
      secondary: '#db2777',
      accent: '#0891b2',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      surface: 'rgba(0, 0, 0, 0.02)',
      border: 'rgba(0, 0, 0, 0.1)',
      text: '#111827',
      textSecondary: '#4b5563',
      success: '#059669',
      error: '#dc2626',
      warning: '#d97706'
    },
    effects: {
      glow: false,
      particles: false,
      scanlines: false,
      neon: false
    }
  },
  
  matrix: {
    name: 'Matrix',
    id: 'matrix',
    colors: {
      primary: '#00ff00',
      secondary: '#00aa00',
      accent: '#00ffaa',
      background: 'linear-gradient(135deg, #000000 0%, #001100 50%, #000000 100%)',
      surface: 'rgba(0, 255, 0, 0.05)',
      border: 'rgba(0, 255, 0, 0.2)',
      text: '#00ff00',
      textSecondary: '#00aa00',
      success: '#00ff88',
      error: '#ff0000',
      warning: '#ffff00'
    },
    effects: {
      glow: true,
      particles: true,
      scanlines: true,
      neon: true
    }
  }
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('cyber');
  const [theme, setTheme] = useState(themes.cyber);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('sync-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
      setTheme(themes[savedTheme]);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    const themeData = themes[currentTheme];
    
    if (themeData) {
      // Set CSS custom properties
      Object.entries(themeData.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
      
      // Set theme class
      root.className = `theme-${currentTheme}`;
      
      // Store in localStorage
      localStorage.setItem('sync-theme', currentTheme);
      
      setTheme(themeData);
    }
  }, [currentTheme]);

  const switchTheme = (themeId) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId);
    }
  };

  const value = {
    currentTheme,
    theme,
    themes,
    switchTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme Switcher Component
export function ThemeSwitcher() {
  const { currentTheme, themes, switchTheme } = useTheme();

  return (
    <div className="relative group">
      <button className="p-2 rounded-lg bg-gray-800/50 border border-purple-500/20 hover:border-purple-500/40 transition-all">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      </button>
      
      <div className="absolute right-0 top-12 bg-gray-800/95 backdrop-blur-sm border border-purple-500/20 rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-48">
        <h4 className="text-sm font-semibold text-white mb-3">Choose Theme</h4>
        
        <div className="space-y-2">
          {Object.values(themes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => switchTheme(theme.id)}
              className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all ${
                currentTheme === theme.id
                  ? 'bg-purple-600/30 border border-purple-500/50'
                  : 'hover:bg-gray-700/50'
              }`}
            >
              <div 
                className="w-4 h-4 rounded border-2"
                style={{ 
                  background: theme.colors.primary,
                  borderColor: theme.colors.secondary
                }}
              />
              <span className="text-sm text-white">{theme.name}</span>
              {currentTheme === theme.id && (
                <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}