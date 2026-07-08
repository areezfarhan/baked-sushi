import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useSearchParams } from 'react-router-dom'
import FloatingWhatsApp from '../components/FloatingWhatsApp';

// Helper to detect protein type from product name
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
  prawn: '🍤',
  chicken: '🍗',
  beef: '🥩'
}

export default function Menu() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  // Get category from URL, default to 'sushi'
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

  // Filter products based on the selected category
  const filteredProducts = products.filter(p => p.category === activeCategory)

  // Function to update category and URL
  const handleCategoryChange = (category) => {
    setSearchParams({ category })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6]">
      {/* HERO SECTION */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12 rounded-[2rem] md:rounded-[2.5rem]">
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-4 border-[#F5F0E6] relative overflow-hidden">
          {/* Red & White Stripes at the very top of the box */}
          <div className="absolute top-0 left-0 right-0 h-4 md:h-6 flex rounded-t-[2rem] md:rounded-t-[2.5rem] overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 ${i % 2 === 0 ? 'bg-[#E31E24]' : 'bg-white'}`}
              ></div>
            ))}
          </div>

          {/* Content Container */}
          <div className="pt-16 pb-12 px-6 md:pt-20 md:pb-16 md:px-10 flex flex-col items-center text-center justify-center min-h-[380px] md:min-h-[450px]">
            {/* Logo Container */}
            <div className="mb-6 md:mb-8 p-3 md:p-4 bg-[#FDFBF7] rounded-2xl shadow-md border-2 border-dashed border-[#E31E24]/20 transform hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Opah's Cafe Logo"
                className="h-28 w-auto object-contain md:h-36"
              />
            </div>

            {/* Badge */}
            <div className="inline-block bg-[#1A237E]/10 text-[#1A237E] px-5 py-1.5 rounded-full mb-6 font-bold text-xs md:text-sm border border-[#1A237E]/20 whitespace-nowrap">
              Made Fresh Daily • Order Before 9AM
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-[#1A237E] mb-4 md:mb-6 font-display tracking-tight h-16 md:h-24 flex items-center justify-center max-w-2xl mx-auto">
              {activeCategory === 'sushi' ? 'Sushi Bake' : 'Seasonal'}
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-600 max-w-md mx-auto font-body leading-relaxed px-4">
              {activeCategory === 'sushi'
                ? 'Premium ingredients, baked to perfection, delivered to you'
                : 'Limited time offerings, crafted with love and nostalgia'}
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY TOGGLE */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <div className="bg-white rounded-full p-1.5 shadow-lg border-2 border-[#F5F0E6] flex">
          <button
            onClick={() => handleCategoryChange('sushi')}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 font-display ${activeCategory === 'sushi'
                ? 'bg-[#1A237E] text-white shadow-md'
                : 'bg-transparent text-gray-500 hover:text-[#1A237E]'
              }`}
          >
            🍣 Sushi Bake
          </button>
          <button
            onClick={() => handleCategoryChange('seasonal')}
            className={`flex-1 py-3 px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 font-display ${activeCategory === 'seasonal'
                ? 'bg-[#1A237E] text-white shadow-md'
                : 'bg-transparent text-gray-500 hover:text-[#1A237E]'
              }`}
          >
            🔥 Seasonal
          </button>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A237E] mb-2 font-display">
            {activeCategory === 'sushi' ? 'Choose Your Flavor' : "This Week's Specials"}
          </h2>
          <p className="text-sm md:text-base text-gray-500">
            {activeCategory === 'sushi'
              ? 'Three delicious options, all baked fresh daily'
              : 'Handcrafted favorites, available for a limited time'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E31E24] border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products available in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProducts.map((p) => {
              const proteinType = getProteinType(p.name)
              const proteinEmoji = proteinIcons[proteinType]
              const displayPrice = p.price;

              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}?category=${activeCategory}`}
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-[#F5F0E6] hover:border-[#1A237E] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
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
                      <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#1A237E] shadow-md border border-[#1A237E]/10">
                        {p.category === 'sushi' ? '280g' : (p.name === 'Baked Potato Salad' ? '700g' : '11 Inch')}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-[#F5F0E6]">
                      <span className="text-[#1A237E] text-sm font-extrabold">RM{Number(displayPrice).toFixed(2)}</span>
                    </div>
                    {p.variants && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="bg-[#E31E24]/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md text-center block">
                          Choose Your Variant
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 md:p-6">
                    <h3 className="text-2xl font-bold text-[#1A237E] mb-2 group-hover:text-[#E31E24] transition-colors font-display">
                      {p.name}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4 line-clamp-3 font-body">
                      {p.description}
                    </p>
                    {p.category === 'sushi' && (
                      <div className="flex items-center gap-2 mb-5 text-xs text-gray-500 bg-[#FDFBF7] px-4 py-2 rounded-full border border-[#F5F0E6]">
                        <span>🌿</span>
                        <span className="font-medium">Includes Laverland Crunch Seaweed</span>
                      </div>
                    )}
                    <button className="w-full bg-[#E31E24] text-white py-3 md:py-3.5 rounded-2xl font-bold text-base group-hover:bg-[#C41820] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-display">
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