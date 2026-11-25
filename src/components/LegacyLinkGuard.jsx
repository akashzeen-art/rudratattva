import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mapLegacyPath } from '../api/catalog'

const LEGACY_HOST = /(?:^|\.)rudraksha-ratna\.com$/i

/**
 * Safety net: any leftover CMS link to rudraksha-ratna.com stays on this site.
 */
export default function LegacyLinkGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = event.target?.closest?.('a[href]')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      let url
      try {
        url = new URL(href, window.location.origin)
      } catch {
        return
      }

      const isLegacyHost = LEGACY_HOST.test(url.hostname)
      const isArticlePath = url.pathname.toLowerCase().startsWith('/articles')
      if (!isLegacyHost && !(isArticlePath && url.origin === window.location.origin)) return

      event.preventDefault()
      const localPath = mapLegacyPath(`${url.pathname}${url.search || ''}`)
      navigate(localPath)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate])

  return null
}
