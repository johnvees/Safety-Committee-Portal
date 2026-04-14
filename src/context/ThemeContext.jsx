import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Apply theme class to <html> so CSS variables cascade to every element,
  // including fixed-position ones like the sidebar.
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, sidebarOpen, setSidebarOpen }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
