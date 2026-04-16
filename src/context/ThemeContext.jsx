import { createContext, useContext, useState, useEffect } from 'react'

// The React context object for theme state
const ThemeContext = createContext()

/**
 * ThemeProvider — manages dark/light mode and sidebar open/closed state.
 *
 * Theme preference is persisted to localStorage ('theme' key).
 * The class is applied to <html> (not just a wrapper div) so CSS variables
 * cascade to every element — including fixed-position ones like the sidebar.
 */
export function ThemeProvider({ children }) {
  // Default to dark mode unless the user previously chose light
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  // Sidebar starts open on desktop; the user can collapse it via the toggle button
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Apply/remove the 'light' class on <html> whenever isDark changes.
  // All Tailwind dark-mode utility classes react to this.
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark])

  /**
   * Toggle between dark and light mode, and persist the choice to localStorage
   * so it is remembered across sessions.
   */
  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{
      isDark,           // true = dark mode is active
      toggleTheme,      // Function to switch between dark and light
      sidebarOpen,      // true = sidebar is expanded; false = collapsed to icon rail
      setSidebarOpen,   // Setter used by Sidebar component's collapse/expand button
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook to consume the theme context. Must be used inside ThemeProvider. */
export const useTheme = () => useContext(ThemeContext)
