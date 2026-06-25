import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme, setTheme, selectTheme } from '../redux/slices/uiSlice'

/**
 * Syncs the redux `ui.theme` value to the <html> class and exposes toggles.
 */
export function useTheme() {
  const theme = useSelector(selectTheme)
  const dispatch = useDispatch()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  return {
    theme,
    isDark: theme === 'dark',
    toggle: () => dispatch(toggleTheme()),
    set: (t) => dispatch(setTheme(t)),
  }
}

export default useTheme
