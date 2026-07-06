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
      
      if (error) console.error('Error:', error)
      else setProducts(data)
    }
    fetchProducts()
  }, [])

  return (
    <div className="space-y-8">
      {/* Cart Link (Styled as a small top-right button) */}
      <div className="flex justify-end">
        <Link to="/cart" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
          View Cart &rarr;
        </Link>
      </div>

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
        {products.map(p => (
          <li key={p.id} className="list-none">
            <Link to={`/product/${p.id}`} className="block bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              
              {/* Image Area: Shows real image if available, otherwise a darker placeholder */}
              <div className="h-48 bg-stone-200 w-full">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Card Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-text-main mb-2">{p.name}</h3>
                <p className="text-primary font-bold text-lg">RM{p.price}</p>
                <p className="text-sm text-primary mt-4 font-medium">Order Now &rarr;</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}