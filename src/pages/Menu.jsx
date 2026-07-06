import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

export default function Menu() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })  // Add this line

      if (error) console.error('Error:', error)
      else setProducts(data)
    }
    fetchProducts()
  }, [])

  return (
    <div className="space-y-8">

      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-text-main tracking-tight">
          Our Baked Sushi
        </h1>
        <p className="text-text-muted max-w-md mx-auto">
          Freshly baked, premium ingredients, and delivered straight to you.
        </p>
      </div>

      {/* Menu Grid */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="group block bg-white rounded-2xl shadow-soft overflow-hidden border border-warm-100 hover:shadow-md transition-shadow duration-300"
          >
            {/* Image Area */}
            <div className="h-48 bg-stone-200 flex items-center justify-center">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            {/* Card Content */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-text-main mb-1">{p.name}</h3>
              <p className="text-primary font-bold text-lg mb-4">RM{p.price}</p>

              {/* YOUR NEW BUTTON STYLE */}
              <div className="block w-full bg-primary text-white text-center py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-all duration-200 hover:shadow-lg mt-4">
                Order Now →
              </div>
            </div>
          </Link>
        ))}
      </ul>
    </div>
  )
}