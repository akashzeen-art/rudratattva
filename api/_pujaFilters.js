const HIDDEN_PUJA_CATEGORY_SLUGS = new Set([
  'p/pujas-in-hindu-temples',
  'k/pujas-at-prayagraj',
  'k/pujas-in-other-famous-hindu-temples',
  'k/pujas-at-vindhyavasini-devi',
  'k/pujas-at-trimbakeshwar',
  'p/shradh-puja-rituals',
  'p/maha-anushthan-pujas',
  'k/chakra-pujas',
  'k/pujas-and-homas-for-guru',
  'k/ved-and-scriptural-pujas',
  'k/maha-pujas',
])

const HIDDEN_PUJA_PRODUCT_SLUGS = new Set([
  'buy/chakshumati-puja-for-eyesight',
  'buy/bhumi-daan-land-donation',
  'buy/ayush-homam',
  'buy/shashti-purthi-pooja',
  'buy/uttar-puja',
  'buy/shodashopachara-puja',
])

const COW_DONATION_KEEP_SLUGS = new Set([
  'buy/gau-puja-and-seva',
  'buy/cow-donation---gau-dan',
])

const KEPT_IDOL_CATEGORY_SLUGS = new Set([
  'p/god-statues-and-idols',
  'p/bronze-idols-of-gods-and-goddesses',
  'p/silver-idols-gods-goddesses',
])

const HIDDEN_IDOL_CATEGORY_SLUGS = new Set([
  'k/other-idols',
  'k/lord-buddha-idols',
  'k/lord-dattatreya-idols',
  'k/indra-idols',
  'k/lord-kartikeya-idols',
  'k/navagrahas-idols',
  'k/panchayatana-deities',
  'k/sai-baba-idols',
  'k/brass-shankh',
  'k/vastu-animal-figurines',
])

const HIDDEN_IDOL_PRODUCT_SLUGS = new Set([
  'buy/925-silver-modak-for-ganesh-puja',
  'buy/925-silver-naag-snake',
  'buy/925-silver-tirupati-balaji-paduka',
  'buy/sheshnag-925-sterling-silver',
  'buy/majestic-peacock-925-sterling-silver-idol',
  'buy/kurma-925-sterling-silver',
  'buy/925-silver-naag-naagin-pair',
])

const KEPT_YANTRA_CATEGORY_SLUGS = new Set([
  'p/yantras',
  'p/siddh-meru-yantras',
])

const HIDDEN_YANTRA_CATEGORY_SLUGS = new Set([
  'p/siddh-shree-yantra',
  'p/gemstone-shree-yantra',
  'k/golden-sheet-yantra',
  'k/silver-yantra',
  'p/pocket-yantras',
  'p/yantra-sticker',
  'k/yantras-on-silk',
])

const KEPT_GEMSTONE_CATEGORY_SLUGS = new Set([
  'p/natural-jyotish-gemstones',
])

const HIDDEN_GEMSTONE_CATEGORY_SLUGS = new Set([
  'k/rose-quartz-stone',
  'k/lapis-lazuli-stone',
  'k/agate-stone',
  'k/aquamarine-stone',
  'k/blue-topaz-stone',
  'k/green-tourmaline-stone',
  'k/heliodor-stone',
  'k/kidney-stone',
  'k/peridot-stone',
  'k/white-zircon-stone',
])

const HIDDEN_RUDRAKSHA_CATEGORY_SLUGS = new Set([
  'k/indrakshi-mala',
  'k/siddha-rudraksha',
  'p/rudraksha-ratna-chakra-jewellery',
  'p/divine-rudraksha-rings',
  'p/rudraksha-beading-kit',
  'p/rudraksha-ratna-chakra-therapy',
  'k/gauri-shankar-rudraksha-bracelets',
  'k/17-mukhi-rudraksha-mala',
  'k/gauri-shankar-rudraksha-mala',
  'k/rudraksha-japa-mala',
  'k/rudraksha-silver-mala',
  'k/rudraksha-copper-mala',
  'k/rudraksha-gold-mala',
  'buy/gauri-shankar-wrist-mala',
  'buy/17-mukhi-rudraksha-925-silver-plain-caps-mala',
  'buy/gauri-shankar-kantha--java-beads',
  'buy/rudraksha-sumarni-mala---10-mm',
  'buy/rudraksha-mala--6mm-with-silver-flowers',
  'buy/kriya-mala',
  'buy/rudraksha-and-crystal-beads-in-pure-gold---7mm',
])

const HIDDEN_LABEL_RE =
  /pujas in hindu temples|shradh puja|chakshumati|maha anushthan|chakra pujas|bhumi daan|ayush homam|sashtiapthapoorthi|shashti.?purthi|uttar puja|shodashopachara|revered saint and guru|ved and scriptural|maha pujas/i

function itemSlug(item = {}) {
  return String(item.slug || item.to || '').replace(/^\//, '').trim()
}

function itemLabel(item = {}) {
  return String(item.label || item.name || item.title || '')
}

function isIdolContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 5 || /idol|god-statues|goddess|silver-idols|bronze-idols/i.test(slug)
}

function isYantraContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 4 || /yantra/i.test(slug)
}

function isGemstoneContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 2 || /gemstone|jyotish|ratna|sapphire|ruby|emerald|pearl|coral|stone/i.test(slug)
}

function isRudrakshaContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 3 || /rudraksha|mukhi|mala|kantha|siddha|indrakshi/i.test(slug)
}

export function filterCatalogChildren(children = [], pageSlug = '', mainprodtype) {
  let list = children || []
  const slug = String(pageSlug || '').replace(/^\//, '')
  const isPuja = Number(mainprodtype) === 1 || /puja|gau|cow-donation/i.test(slug)

  if (isPuja) {
    list = list.filter(c => {
      const s = itemSlug(c)
      if (s && HIDDEN_PUJA_CATEGORY_SLUGS.has(s)) return false
      return !HIDDEN_LABEL_RE.test(itemLabel(c))
    })
  }

  if (slug === 'c/god-and-goddess-idols') {
    list = list.filter(c => KEPT_IDOL_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (isIdolContext(slug, mainprodtype)) {
    list = list.filter(c => !HIDDEN_IDOL_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (slug === 'c/yantras-and-mahayantras') {
    list = list.filter(c => KEPT_YANTRA_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (isYantraContext(slug, mainprodtype)) {
    list = list.filter(c => !HIDDEN_YANTRA_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (slug === 'c/ratna-vedic-gemstones') {
    list = list.filter(c => KEPT_GEMSTONE_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (isGemstoneContext(slug, mainprodtype)) {
    list = list.filter(c => !HIDDEN_GEMSTONE_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (isRudrakshaContext(slug, mainprodtype)) {
    list = list.filter(c => !HIDDEN_RUDRAKSHA_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  return list
}

export function filterCatalogProducts(products = [], pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  const isPuja = Number(mainprodtype) === 1 || /puja|gau|cow-donation/i.test(slug)
  let list = products || []

  if (isPuja) {
    list = list.filter(p => {
      const s = itemSlug(p)
      if (slug === 'p/cow-donation-charity' || /cow.?donation|gau.?seva/i.test(slug)) {
        return COW_DONATION_KEEP_SLUGS.has(s)
      }
      if (s && HIDDEN_PUJA_PRODUCT_SLUGS.has(s)) return false
      return !HIDDEN_LABEL_RE.test(itemLabel(p))
    })
  }

  if (isIdolContext(slug, mainprodtype)) {
    list = list.filter(p => !HIDDEN_IDOL_PRODUCT_SLUGS.has(itemSlug(p)))
  }

  return list
}
