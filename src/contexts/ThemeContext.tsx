// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { Theme, mauveTheme } from '@/styles/theme';

const ThemeContext = createContext<Theme>(mauveTheme);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  theme = mauveTheme,
  children 
}) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};