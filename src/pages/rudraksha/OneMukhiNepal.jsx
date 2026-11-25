import RudrakshaListingPage from '../../components/RudrakshaListingPage'

const products = [
  { id:1, name:'1 Mukhi Half Moon Bhadraksha - Small', sku:'R01S', price:1500, img:'/images/1-mukhi-nepal/R01S-S-NEW_108754.jpg', inStock:true },
  { id:2, name:'1 Mukhi Half Moon Bhadraksha - Large', sku:'R01L', price:2100, img:'/images/1-mukhi-nepal/R01L-S-NEW_108751.jpg', inStock:true },
  { id:3, name:'1 Mukhi Half Moon Bhadraksha - Regular', sku:'R01', price:1800, img:'/images/1-mukhi-nepal/R01-1_Mukhi_Half_Moon_Regular_thumb.jpg', inStock:true },
  { id:4, name:'1 Mukhi Nepal Rudraksha - I', sku:'K-38195', price:45000, img:'/images/1-mukhi-nepal/K-38195-S_235522.jpg', inStock:true },
  { id:5, name:'1 Mukhi Nepal Rudraksha - II', sku:'K-38196', price:45000, img:'/images/1-mukhi-nepal/K-38196-S_235523.jpg', inStock:true },
  { id:6, name:'1 Mukhi Nepal Rudraksha - III', sku:'K-38197', price:45000, img:'/images/1-mukhi-nepal/K-38197-S_235524.jpg', inStock:true },
  { id:7, name:'1 Mukhi Nepal Rudraksha - IV', sku:'K-38482', price:45000, img:'/images/1-mukhi-nepal/K-38482-S_235570.jpg', inStock:true },
  { id:8, name:'1 Mukhi Nepal Rudraksha - V', sku:'K-38483', price:45000, img:'/images/1-mukhi-nepal/K-38483-S_235571.jpg', inStock:true },
  { id:9, name:'1 Mukhi Nepal Rudraksha - VI', sku:'K-38485', price:45000, img:'/images/1-mukhi-nepal/K-38485-S_235573.jpg', inStock:true },
  { id:10, name:'1 Mukhi Nepal Rudraksha - VII', sku:'K-38713', price:45000, img:'/images/1-mukhi-nepal/K-38713-S_237097.jpg', inStock:true },
  { id:11, name:'1 Mukhi Nepal Rudraksha - VIII', sku:'K-38714', price:45000, img:'/images/1-mukhi-nepal/K-38714-S_237098.jpg', inStock:true },
  { id:12, name:'1 Mukhi Nepal Rudraksha - Collector', sku:'K-33582', price:75000, img:'/images/1-mukhi-nepal/K-33582-S1_179212.jpg', inStock:false },
]

const mappedProducts = products.map(p => ({
  ...p,
  grade: p.sku?.startsWith('SCB') ? 'Super Collector' : p.sku?.startsWith('CB') ? 'Collector' : p.sku?.startsWith('K-33') || p.sku?.startsWith('K-34') ? 'Collector' : 'Standard',
  beadSize: p.price > 40000 ? '20-25 mm' : '15-20 mm',
}))

const keyFacts = [
  'Ruling Deity: Lord Shiva',
  'Ruling Planet: Sun (Surya)',
  'Nepal Bead Size: 15–25 mm',
  'Favorable Day: Monday / Sunday',
  'Beej Mantra: Om Hreem Namah',
  'Other Mantras: Om Namah Shivay',
]

const faqs = [
  { q: 'What is 1 Mukhi Rudraksha?', a: '1 Mukhi Rudraksha is the rarest and most powerful of all Rudraksha beads. It represents Lord Shiva himself and is associated with the Sun. The round 1 Mukhi Nepal is extremely rare; the Half Moon (Bhadraksha) form is more commonly available.' },
  { q: 'What are the benefits of 1 Mukhi Rudraksha?', a: 'It bestows supreme consciousness, liberation (moksha), and immense spiritual power. It removes all sins, enhances concentration, and is excellent for meditation. It also removes the malefic effects of the Sun.' },
  { q: 'What is the price of 1 Mukhi Nepal Rudraksha?', a: '1 Mukhi Nepal Rudraksha price ranges from ₹1,500 (Half Moon Small) to ₹75,000+ (round collector bead) depending on form and rarity.' },
  { q: 'Who should wear 1 Mukhi Rudraksha?', a: 'It is recommended for spiritual seekers, those seeking liberation, people with Sun-related doshas in their horoscope, and anyone seeking supreme consciousness and inner peace.' },
  { q: 'What is the difference between Half Moon and Round 1 Mukhi?', a: 'The Half Moon (Bhadraksha) is a naturally occurring crescent-shaped 1 Mukhi bead, more commonly available. The round 1 Mukhi Nepal is extremely rare and commands a very high price.' },
]

export default function OneMukhiNepal() {
  return (
    <RudrakshaListingPage
      title="1 Mukhi (Face) Nepali Rudraksha"
      breadcrumb="1 Mukhi Nepal"
      description="The 1 Mukhi Rudraksha is the rarest and most powerful Rudraksha bead. It represents Lord Shiva himself and is associated with the Sun. Wearing this bead bestows supreme consciousness, liberation, and immense spiritual power. Available in Half Moon (Bhadraksha) and rare round forms."
      products={mappedProducts}
      keyFacts={keyFacts}
      faqs={faqs}
    />
  )
}
