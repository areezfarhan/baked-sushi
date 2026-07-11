import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useSearchParams } from 'react-router-dom'
import FloatingWhatsApp from '../components/FloatingWhatsApp';

const getProteinType = (name) => {
  const lower = name.toLowerCase()
  if (lower.includes('salmon') || lower.includes('tuna')) return 'salmon'
  if (lower.includes('prawn')) return 'prawn'
  if (lower.includes('chicken') || lower.includes('teriyaki')) return 'chicken'
  if (lower.includes('beef') || lower.includes('daging')) return 'beef'
  return 'salmon'
}

const proteinIcons = {
  salmon: '🍣',
  prawn: '',
  chicken: '🍗',
  beef: '🥩'
}

export default function Menu() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || 'sushi'

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      if (error) console.error('Error:', error)
      else setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(p => p.category === activeCategory)
  const handleCategoryChange = (category) => setSearchParams({ category })

  return (
    // Main wrapper: Transparent/light to let the wood texture from index.css show through
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 md:px-6 bg-warm-100/50 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">

      {/* HERO SECTION */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12 flex justify-center">
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-elevated border-2 border-accent/20 relative overflow-hidden w-full max-w-3xl">
          {/* Gold & Cream Stripes */}
          <div className="absolute top-0 left-0 right-0 h-4 md:h-6 flex rounded-t-[2rem] md:rounded-t-[2.5rem] overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-accent' : 'bg-warm-100'}`}></div>
            ))}
          </div>

          <div className="pt-16 pb-12 px-6 md:pt-20 md:pb-16 md:px-10 flex flex-col items-center text-center justify-center min-h-[380px] md:min-h-[450px]">
            <div className="mb-6 md:mb-8 p-3 md:p-4 bg-warm-50 rounded-2xl shadow-warm border-2 border-dashed border-accent/30 transform hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Logo" className="h-28 w-auto object-contain md:h-36" />
            </div>

            {/* Badge */}
            <div className="mb-6 md:mb-8 flex flex-col items-center gap-2">
              <div className="inline-block bg-primary/10 text-primary px-5 py-1.5 rounded-full font-bold text-xs md:text-sm border border-primary/20 whitespace-nowrap font-body">
                Made Fresh Daily • Order Before 9AM
              </div>
              <div className="text-accent text-lg md:text-xl font-script italic">
                by Warisan Opah
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4 md:mb-6 font-display tracking-tight h-16 md:h-24 flex items-center justify-center max-w-2xl mx-auto">
              {activeCategory === 'sushi' ? 'Sushi Bake' : 'Seasonal'}
            </h1>

            <p className="text-sm md:text-base text-text-body max-w-md mx-auto font-body leading-relaxed px-1 md:px-0">
              {activeCategory === 'sushi'
                ? 'Premium ingredients, baked to perfection, delivered to you'
                : 'Limited time offerings, crafted with love and nostalgia'}
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY TOGGLE */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <div className="bg-warm-50 rounded-full p-1.5 shadow-warm border border-wood-light flex">
          <button
            onClick={() => handleCategoryChange('sushi')}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 font-display ${activeCategory === 'sushi'
                ? 'bg-primary text-warm-50 shadow-md'
                : 'bg-transparent text-text-muted hover:text-primary'
              }`}
          >
            🍣 Sushi Bake
          </button>
          <button
            onClick={() => handleCategoryChange('seasonal')}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 font-display ${activeCategory === 'seasonal'
                ? 'bg-primary text-warm-50 shadow-md'
                : 'bg-transparent text-text-muted hover:text-primary'
              }`}
          >
            🔥 Seasonal
          </button>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2 font-display">
            {activeCategory === 'sushi' ? 'Choose Your Flavor' : "This Week's Specials"}
          </h2>
          <p className="text-sm md:text-base text-text-muted">
            {activeCategory === 'sushi'
              ? 'Three delicious options, all baked fresh daily'
              : 'Handcrafted favorites, available for a limited time'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg">No products available in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProducts.map((p) => {
              const proteinType = getProteinType(p.name)
              const proteinEmoji = proteinIcons[proteinType]
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}?category=${activeCategory}`}
                  className="group bg-white rounded-3xl shadow-soft overflow-hidden border-2 border-warm-200 hover:border-accent hover:shadow-elevated hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="relative bg-stone-100">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-auto object-contain" />
                    ) : (
                      <div className="w-full h-60 flex items-center justify-center text-6xl">
                        {proteinEmoji}
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-md border border-primary/10">
                        {p.category === 'sushi' ? '280g' : (p.name === 'Baked Potato Salad' ? '700g' : '11 Inch')}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-warm-200">
                      <span className="text-primary text-sm font-extrabold">RM{Number(p.price).toFixed(2)}</span>
                    </div>
                    {p.variants && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="bg-accent/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-warm-50 shadow-md text-center block">
                          Choose Your Variant
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 md:p-6">
                    <h3 className="text-2xl font-bold text-primary mb-2 group-hover:text-accent transition-colors font-display">
                      {p.name}
                    </h3>
                    <p className="text-text-body text-sm md:text-base leading-relaxed mb-4 line-clamp-3 font-body">
                      {p.description}
                    </p>
                    {p.category === 'sushi' && (
                      <div className="flex items-center gap-2 mb-5 text-xs text-text-muted bg-warm-50 px-4 py-2 rounded-full border border-warm-200">
                        <span>🌿</span>
                        <span className="font-medium">Includes Laverland Crunch Seaweed</span>
                      </div>
                    )}
                    <button className="w-full bg-primary text-warm-50 py-3 md:py-3.5 rounded-2xl font-bold text-base group-hover:bg-primary-dark transition-all duration-200 shadow-warm hover:shadow-elevated flex items-center justify-center gap-2 font-display">
                      <span>Order Now</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <FloatingWhatsApp />
    </div>
  )
}