import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import CategoryListingPage from '../components/CategoryListingPage'
import { loadCatalogPage, loadMoreProducts } from '../api/catalog'
import { getRegularRedirect } from '../data/rudrakshaRegular'
import { getGemstoneBuyRedirect } from '../data/gemstoneBuy'

/** Live first-level category homes (c/*) matching rudraksha-ratna.com */
const MAIN_CATEGORY_SLUGS = {
  rudraksha: 'c/rudraksha',
  gemstones: 'c/ratna-vedic-gemstones',
  yantra: 'c/yantras-and-mahayantras',
  idols: 'c/god-and-goddess-idols',
  pujas: 'c/online-puja-services',
}

const EMPTY_SERVER_FILTERS = {
  minPrice: '',
  maxPrice: '',
  beadMin: '',
  beadMax: '',
  sizeGrade: '',
  caratMin: '',
  caratMax: '',
  origin: '',
  shape: '',
}

function titleFromSlug(slug) {
  return (slug || '')
    .split('/')
    .pop()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function useCatalog(slugValue, fallbackTitle) {
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(fallbackTitle)
  const [description, setDescription] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [tabs, setTabs] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [products, setProducts] = useState([])
  const [childrenCards, setChildrenCards] = useState([])
  const [bannerImage, setBannerImage] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [pageNo, setPageNo] = useState(1)
  const [mainprodtype, setMainprodtype] = useState(null)
  const [filterMeta, setFilterMeta] = useState(null)
  const [serverFilters, setServerFilters] = useState(EMPTY_SERVER_FILTERS)
  const [sortBy, setSortBy] = useState('')

  const filterKey = useMemo(
    () => JSON.stringify(serverFilters),
    [serverFilters]
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setProducts([])
    setChildrenCards([])
    setTitle(fallbackTitle)
    setTabs(null)
    setFaqs([])

    loadCatalogPage(slugValue, 1, serverFilters)
      .then(page => {
        if (!active) return
        setTitle(page.intro.title)
        setDescription(page.intro.description)
        setDescriptionHtml(page.intro.descriptionHtml || '')
        setBreadcrumbs(page.intro.breadcrumbs)
        setTabs(page.intro.tabs)
        setFaqs(page.intro.faqs)
        setBannerImage(page.intro.bannerImage || '')
        setProducts(page.products)
        setChildrenCards(page.children)
        setHasMore(page.hasMore)
        setPageNo(page.pageNo)
        setMainprodtype(page.mainprodtype)
        if (page.filterMeta) setFilterMeta(page.filterMeta)
        setLoading(false)
      })
      .catch(err => {
        if (!active) return
        setError(err.message || 'Unable to load this page')
        setDescription(`Explore authentic ${fallbackTitle} from Gems & Jewels.`)
        setLoading(false)
      })

    return () => { active = false }
  }, [slugValue, fallbackTitle, filterKey, serverFilters])

  const onFiltersChange = useCallback((next) => {
    if (Object.prototype.hasOwnProperty.call(next, 'sortBy')) {
      setSortBy(next.sortBy || '')
    }
    const serverPatch = {}
    let hasServer = false
    for (const key of Object.keys(EMPTY_SERVER_FILTERS)) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        serverPatch[key] = next[key]
        hasServer = true
      }
    }
    if (hasServer) {
      setServerFilters(prev => ({ ...prev, ...serverPatch }))
    }
  }, [])

  const onLoadMore = async () => {
    if (!hasMore || loadingMore) return
    const next = pageNo + 1
    setLoadingMore(true)
    try {
      const page = await loadMoreProducts(slugValue, mainprodtype, next, serverFilters)
      setProducts(prev => [...prev, ...page.products])
      setPageNo(page.pageNo)
      setHasMore(page.hasMore)
      if (page.filterMeta) setFilterMeta(page.filterMeta)
    } catch {
      /* keep existing list */
    } finally {
      setLoadingMore(false)
    }
  }

  const filters = useMemo(
    () => ({ ...serverFilters, sortBy }),
    [serverFilters, sortBy]
  )

  return {
    title,
    breadcrumbs,
    description,
    descriptionHtml,
    tabs,
    faqs,
    childrenCards,
    products,
    bannerImage,
    loading,
    error,
    hasMore,
    onLoadMore,
    loadingMore,
    filterMeta,
    filters,
    onFiltersChange,
  }
}

function CatalogView({ slugValue, fallbackTitle }) {
  const props = useCatalog(slugValue, fallbackTitle)
  return (
    <CategoryListingPage
      title={props.title}
      breadcrumbs={props.breadcrumbs}
      description={props.description}
      descriptionHtml={props.descriptionHtml}
      tabs={props.tabs}
      faqs={props.faqs}
      childrenCards={props.childrenCards}
      products={props.products}
      bannerImage={props.bannerImage}
      loading={props.loading}
      error={props.error}
      hasMore={props.hasMore}
      onLoadMore={props.onLoadMore}
      loadingMore={props.loadingMore}
      filterMeta={props.filterMeta}
      filters={props.filters}
      onFiltersChange={props.onFiltersChange}
    />
  )
}

export default function CatalogPage({ prefix, slug: slugProp }) {
  const params = useParams()
  const rest = params['*'] || ''
  const slugValue = (slugProp || `${prefix}/${rest}`).replace(/\/$/, '')
  const regular = getRegularRedirect(slugValue)
  if (regular?.productSlug) {
    return <Navigate to={`/${regular.productSlug}`} replace />
  }
  const gemBuy = getGemstoneBuyRedirect(slugValue)
  if (gemBuy?.productSlug) {
    return <Navigate to={`/${gemBuy.productSlug}`} replace />
  }
  const fallbackTitle = titleFromSlug(slugValue)
  return <CatalogView key={slugValue} slugValue={slugValue} fallbackTitle={fallbackTitle} />
}

export function MainCategoryPage({ type }) {
  const slugValue = MAIN_CATEGORY_SLUGS[type]
  const fallbackTitle = {
    rudraksha: 'Rudraksha',
    gemstones: 'Gemstones',
    yantra: 'Yantras',
    idols: 'Gods & Goddesses Idols',
    pujas: 'Online Puja Services',
  }[type] || titleFromSlug(slugValue)

  return <CatalogView key={slugValue} slugValue={slugValue} fallbackTitle={fallbackTitle} />
}
