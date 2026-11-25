import RudrakshaListingPage from '../../components/RudrakshaListingPage'

const products = [
  { id:1, name:'Rare Two Mukhi from Nepal Small', sku:'R02S', price:18000, img:'/images/2-mukhi-nepal/K-27703-S_109860.jpg', inStock:true },
  { id:2, name:'Rare Two Mukhi from Nepal', sku:'R02', price:24000, img:'/images/2-mukhi-nepal/K-35479-S_193709.jpg', inStock:true },
  { id:3, name:'Rare 2 Mukhi from Nepal - CCX Small', sku:'R02HN', price:24000, img:'/images/2-mukhi-nepal/K-35979-S_205648.jpg', inStock:true },
  { id:4, name:'Rare 2 Mukhi from Nepal - CCXI', sku:'R02HO', price:28000, img:'/images/2-mukhi-nepal/K-35980-S_205649.jpg', inStock:true },
  { id:5, name:'Rare 2 Mukhi from Nepal - CCXIV Small', sku:'R02HR', price:24000, img:'/images/2-mukhi-nepal/K-35983-S1_205690.jpg', inStock:true },
  { id:6, name:'Rare 2 Mukhi from Nepal - CCXV Small', sku:'R02HS', price:24000, img:'/images/2-mukhi-nepal/K-35984-S1_205691.jpg', inStock:true },
  { id:7, name:'Rare 2 Mukhi from Nepal Small - DVIII', sku:'RS02KY', price:24000, img:'/images/2-mukhi-nepal/K-37181-S_218799.jpg', inStock:true },
  { id:8, name:'Rare 2 Mukhi from Nepal Small - DXII', sku:'RS02LC', price:24000, img:'/images/2-mukhi-nepal/K-37185-S_218802.jpg', inStock:true },
  { id:9, name:'Rare 2 Mukhi from Nepal Small - DXIII', sku:'RS02LD', price:24000, img:'/images/2-mukhi-nepal/K-37186-S_218803.jpg', inStock:true },
  { id:10, name:'Rare 2 Mukhi from Nepal Small - DXV', sku:'RS02LF', price:24000, img:'/images/2-mukhi-nepal/K-37188-S_218805.jpg', inStock:true },
  { id:11, name:'Rare 2 Mukhi from Nepal Small - DXIV', sku:'RS02LE', price:24000, img:'/images/2-mukhi-nepal/RS02LE-S_227134.jpg', inStock:true },
  { id:12, name:'Rare 2 Mukhi Nepali Large', sku:'R02L', price:35000, img:'/images/2-mukhi-nepal/K-34905-S_184986.jpg', inStock:true },
]

const mappedProducts = products.map(p => ({
  ...p,
  grade: p.price >= 35000 ? 'Large' : p.price >= 28000 ? 'Regular' : 'Small',
  beadSize: p.price >= 35000 ? '22-26 mm' : '16-20 mm',
}))

const keyFacts = [
  'Ruling Deity: Ardhanareshwar (Shiva-Parvati)',
  'Ruling Planet: Moon (Chandra)',
  'Nepal Bead Size: 16–26 mm',
  'Favorable Day: Monday',
  'Beej Mantra: Om Namah',
  'Other Mantras: Om Namah Shivay',
]

const faqs = [
  { q: 'What is 2 Mukhi Rudraksha?', a: '2 Mukhi Rudraksha represents Ardhanareshwar — the combined form of Lord Shiva and Goddess Parvati. It symbolizes unity, harmony, and the balance of masculine and feminine energies.' },
  { q: 'What are the benefits of wearing 2 Mukhi Rudraksha?', a: 'It improves relationships, brings harmony in family life, enhances emotional balance, and is beneficial for those seeking unity and togetherness in their personal and professional lives.' },
  { q: 'What is the price of 2 Mukhi Nepal Rudraksha?', a: '2 Mukhi Nepal Rudraksha price ranges from ₹18,000 to ₹1,51,000 depending on size (Small, Regular, Large) and rarity.' },
  { q: 'Who should wear 2 Mukhi Rudraksha?', a: 'It is recommended for people who want to improve their relationships, those in partnerships or marriages, and anyone seeking emotional balance and harmony.' },
  { q: 'How to wear 2 Mukhi Rudraksha?', a: 'It can be worn as a pendant in silver or gold, or as a bracelet. It should be energized with proper Vedic rituals before wearing.' },
]

export default function TwoMukhiNepal() {
  return (
    <RudrakshaListingPage
      title="2 Mukhi (Face) Nepali Rudraksha"
      breadcrumb="2 Mukhi Nepal"
      description="The 2 Mukhi Rudraksha represents Ardhanareshwar — the combined form of Lord Shiva and Goddess Parvati. It symbolizes unity, harmony, and the balance of masculine and feminine energies. Explore our collection of genuine two-face Rudraksha beads in Small, Regular, and Large sizes."
      products={mappedProducts}
      keyFacts={keyFacts}
      faqs={faqs}
    />
  )
}
