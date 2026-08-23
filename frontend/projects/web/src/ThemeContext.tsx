import React, { createContext, useContext } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  themeMode: ThemeMode
  isLight: boolean
}

export const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'light',
  isLight: true,
})

export const useTheme = () => useContext(ThemeContext)

