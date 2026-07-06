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
    
    // 1. Fetch all active products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, active')
      .eq('active', true)
      
    if (productsError) {
      console.error('Error fetching products:', productsError)
      setLoading(false)
      return
    }

    // 2. Fetch REMAINING stock for the selected date (This is what the customer sees!)
    const { data: stockData, error: stockError } = await supabase
      .from('stock_by_date')
      .select('product_id, remaining_stock') 
      .eq('date', selectedDate)
      
    if (stockError) {
      console.error('Error fetching stock:', stockError)
    }

    // 3. Create a map of product_id -> remaining_stock
    const stockMap = {}
    if (stockData) {
      stockData.forEach(stock => {
        stockMap[stock.product_id] = stock.remaining_stock
      })
    }

    // 4. Combine products with their remaining stock
    // If stockMap has the ID, use the real remaining stock (e.g., 7). 
    // If not (new date), default to 10.
    const formatted = productsData.map(product => ({
      id: product.id,
      name: product.name,
      stock: stockMap.hasOwnProperty(product.id) ? stockMap[product.id] : 10 
    }))

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
    
    // When saving, we update BOTH total_stock and remaining_stock to the new value.
    // This allows you to "top up" the stock. (e.g. if it's 7, and you type 10, it adds 3 back).
    const stockData = products.map(p => ({
      product_id: p.id,
      date: selectedDate,
      total_stock: p.stock,
      remaining_stock: p.stock 
    }))

    const { error } = await supabase
      .from('stock_by_date')
      .upsert(stockData, { onConflict: 'product_id, date' })

    if (error) {
      console.error('Error saving stock:', error)
      alert('Error saving stock: ' + error.message)
    } else {
      alert('Stock updated successfully!')
      fetchInventory() // Refresh to confirm
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
          <p>No active products found.</p>
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