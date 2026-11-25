import PageLayout from '../components/PageLayout'

const products = [
  { img: '/images/rudraksha/rudraksha-bracelet-category-thumbnail_206523.jpg', name: 'Rudraksha Bracelets' },
  { img: '/images/rudraksha/rudraksha-malas-and-kanthas-category-thumbnail.jpg', name: 'Rudraksha Malas & Kanthas' },
  { img: '/images/rudraksha/rudraksha-ratna-7-chakra-jewellery-category-thumbnail_206526.jpg', name: '7 Chakra Jewellery' },
  { img: '/images/gemstones/Natural-Gemstone-Bracelets_217362.jpg', name: 'Gemstone Bracelets' },
  { img: '/images/gemstones/Natural-Gemstone-Necklaces-Mala_217362.jpg', name: 'Gemstone Necklaces & Malas' },
  { img: '/images/gemstones/Gemstone-Earrings_217361.jpg', name: 'Gemstone Earrings' },
  { img: '/images/rudraksha/OM-Design-Round-Silver-s_218520.jpg', name: 'Rudraksha Rings' },
  { img: '/images/yantra/Yantra-Lockets_219090.jpg', name: 'Yantra Lockets' },
]

export default function Jewellery() {
  return (
    <PageLayout
      title="Spiritual Jewellery"
      description="Explore spiritual malas, bracelets, rings, lockets and chakra jewellery crafted with authentic Rudraksha beads, natural gemstones and sacred yantras at Rudra Tattva."
    >
      {products.map(p => (
        <div className="product-card" key={p.name}>
          <img src={p.img} alt={p.name} />
          <p className="p-name">{p.name}</p>
        </div>
      ))}
    </PageLayout>
  )
}
