import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

// Protein icons for each product
const proteinIcons = {
  'salmon': '',
  'prawn': '🦐',
  'chicken': '🐔'
}

// Helper to detect protein type from product name
const getProteinType = (name) => {
  const lower = name.toLowerCase()
  if (lower.includes('salmon') || lower.includes('tuna')) return 'salmon'
  if (lower.includes('prawn')) return 'prawn'
  if (lower.includes('chicken') || lower.includes('teriyaki')) return 'chicken'
  return 'salmon'
}

export default function Menu() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })
      
      if (error) console.error('Error:', error)
      else setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  return (
    // 1. Creamy Gradient Background for the whole page
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6]">
      
      {/* HERO SECTION - Inside a distinct box */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-[#F5F0E6] relative overflow-hidden">
          
          {/* Red & White Stripes at the very top of the box */}
          <div className="absolute top-0 left-0 right-0 h-4 flex">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 ${i % 2 === 0 ? 'bg-[#E31E24]' : 'bg-white'}`}
              ></div>
            ))}
          </div>

          <div className="pt-10 pb-8 px-6 flex flex-col items-center text-center">
            
            {/* Logo Container */}
            <div className="mb-4 p-3 bg-[#FDFBF7] rounded-2xl shadow-md border-2 border-dashed border-[#E31E24]/20 transform hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo.png" 
                alt="Opah's Cafe Logo" 
                className="h-28 w-auto object-contain" 
              />
            </div>

            {/* Badge */}
            <div className="inline-block bg-[#1A237E]/10 text-[#1A237E] px-5 py-1.5 rounded-full mb-4 font-bold text-xs border border-[#1A237E]/20 whitespace-nowrap">
              🍣 Fresh Daily • Order Before 9AM
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-[#1A237E] mb-3 font-display tracking-tight">
               Sushi Bake
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 max-w-lg mx-auto font-body">
              Premium ingredients, baked to perfection, delivered to you
            </p>
          </div>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Section Header - Reduced Spacing */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1A237E] mb-2 font-display">Choose Your Flavor</h2>
          <p className="text-gray-500 text-sm">Three delicious options, all baked fresh daily</p>
        </div>

        {/* Products Grid - Reduced Gap */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E31E24] border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const proteinType = getProteinType(p.name)
              const proteinEmoji = proteinIcons[proteinType]
              
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  // 2. Enhanced Hover & Shadow Effects for "Floating" look
                  className="group bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-[#F5F0E6] hover:border-[#1A237E] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Image Area */}
                  <div className="relative h-60 bg-stone-100 overflow-hidden">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {proteinEmoji}
                      </div>
                    )}
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#1A237E] shadow-md border border-[#1A237E]/10">
                        280g
                      </span>
                      <span className="bg-[#E31E24] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                        {proteinEmoji}
                      </span>
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-[#F5F0E6]">
                      <span className="text-[#1A237E] font-bold text-lg">RM{p.price}</span>
                    </div>
                  </div>

                  {/* Card Content - Reduced Padding */}
                  <div className="p-5">
                    <h3 className="text-2xl font-bold text-[#1A237E] mb-2 group-hover:text-[#E31E24] transition-colors font-display">
                      {p.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 font-body">
                      {p.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-5 text-xs text-gray-500 bg-[#FDFBF7] px-4 py-2 rounded-full border border-[#F5F0E6]">
                      <span>🌿</span>
                      <span className="font-medium">Includes Laverland Crunch Seaweed</span>
                    </div>
                    
                    {/* Order Button */}
                    <button className="w-full bg-[#E31E24] text-white py-3 rounded-2xl font-bold text-base group-hover:bg-[#C41820] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-display">
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
    </div>
  )
}