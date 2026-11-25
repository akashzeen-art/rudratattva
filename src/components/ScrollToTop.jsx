import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Always scroll to the top on route changes, browser back/forward, and refresh.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    // Keep in-page hash anchors working when a hash is present on PUSH.
    if (hash && navType === 'PUSH') {
      const id = hash.slice(1)
      const el = id ? document.getElementById(id) : null
      if (el) {
        el.scrollIntoView()
        return
      }
    }

    window.scrollTo(0, 0)
  }, [pathname, search, hash, navType])

  return null
}
