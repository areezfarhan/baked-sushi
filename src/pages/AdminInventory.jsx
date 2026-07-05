import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminInventory() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchInventory()
  }, [selectedDate])

  const fetchInventory = async () => {
    setLoading(true)
    console.log('🔍 Fetching products...')
    
    // First, fetch all products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, active')
      .eq('active', true)
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      setLoading(false)
      return
    }

    console.log('✅ Products fetched:', productsData)

    if (!productsData || productsData.length === 0) {
      console.warn('⚠️ No active products found')
      setProducts([])
      setLoading(false)
      return
    }

    // Then, fetch existing stock for the selected date
    const { data: stockData, error: stockError } = await supabase
      .from('stock_by_date')
      .select('product_id, total_stock')
      .eq('date', selectedDate)

    if (stockError) {
      console.error('❌ Error fetching stock:', stockError)
    }

    // Combine products with their stock
    const stockMap = {}
    if (stockData) {
      stockData.forEach(stock => {
        stockMap[stock.product_id] = stock.total_stock
      })
    }

    const formatted = productsData.map(product => ({
      id: product.id,
      name: product.name,
      stock: stockMap[product.id] !== undefined ? stockMap[product.id] : 0
    }))

    console.log('📋 Formatted inventory:', formatted)
    setProducts(formatted)
    setLoading(false)
  }

  const handleStockChange = (productId, newStock) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: parseInt(newStock) || 0 } : p
    ))
  }

    const handleSave = async () => {
    setLoading(true)
    
    // Prepare data for upsert
    const stockData = products.map(p => ({
      product_id: p.id,
      date: selectedDate,
      total_stock: p.stock,
      remaining_stock: p.stock // <--- ADD THIS LINE!
    }))

    const { error } = await supabase
      .from('stock_by_date')
      .upsert(stockData, { onConflict: 'product_id, date' })

    if (error) {
      console.error('Error saving stock:', error)
      alert('Error saving stock: ' + error.message)
    } else {
      alert('Stock updated successfully!')
      fetchInventory() // Refresh the data
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Inventory Management</h1>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Date:</label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: '8px' }}
        />
      </div>

      {loading && !products.length ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <p>No products found. Make sure your 'products' table has active products.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '500px' }}>
          <h3>Stock for {selectedDate}</h3>
          {products.map(product => (
            <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '16px' }}>{product.name}</span>
              <input 
                type="number" 
                min="0"
                value={product.stock} 
                onChange={(e) => handleStockChange(product.id, e.target.value)}
                style={{ width: '80px', padding: '8px', textAlign: 'center' }}
              />
            </div>
          ))}
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '10px', 
              background: loading ? '#9ca3af' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Saving...' : 'Save Stock Levels'}
          </button>
        </div>
      )}
    </div>
  )
}