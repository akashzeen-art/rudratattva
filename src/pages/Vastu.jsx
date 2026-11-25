import PageLayout from '../components/PageLayout'

const products = [
  { img: '/images/home/categories/parad.jpg', name: 'Parad' },
  { img: '/images/home/categories/narmada.jpg', name: 'Narmada Shivling' },
  { img: '/images/home/categories/meru.jpg', name: 'Vastu Yantras' },
  { img: '/images/idols/brass-new_110599.jpg', name: 'Shaligrams' },
  { img: '/images/pujas/Daily-Puja-Category-thumb_236041.jpg', name: 'Puja Items' },
  { img: '/images/home/consultations/chakra-vastu.jpg', name: 'Chakra Vastu Remedies' },
]

export default function Vastu() {
  return (
    <PageLayout
      title="Chakra Vastu"
      description="Balance the elements, colours, directions, cuts and corners of your home or workplace. Explore Parad, Shaligrams, Narmada Shivlings, Vastu Yantras and remedial products from Rudra Tattva."
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
