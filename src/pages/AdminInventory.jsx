import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminInventory() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date()) // For calendar navigation
  const [products, setProducts] = useState([])
  const [configuredDates, setConfiguredDates] = useState(new Set()) // Dates that have stock
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // 1. Fetch inventory when selected date changes (PRESERVED LOGIC)
  useEffect(() => {
    fetchInventory()
  }, [selectedDate])

  // 2. Fetch calendar highlights when the month changes (NEW LOGIC)
  useEffect(() => {
    fetchConfiguredDates()
  }, [currentMonth])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, active')
        .eq('active', true)
        
      const { data: stockData } = await supabase
        .from('stock_by_date')
        .select('product_id, remaining_stock')
        .eq('date', selectedDate)
        
      const stockMap = {}
      if (stockData) {
        stockData.forEach(stock => {
          stockMap[stock.product_id] = stock.remaining_stock
        })
      }

      // PRESERVED: Shows actual remaining stock if it exists, else defaults to 10
      const formatted = productsData.map(product => ({
        id: product.id,
        name: product.name,
        stock: stockMap.hasOwnProperty(product.id) ? stockMap[product.id] : 10 
      }))

      setProducts(formatted)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  // NEW: Fetch all dates in the current month that have stock configured
  const fetchConfiguredDates = async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0] // Last day of month

    const { data } = await supabase
      .from('stock_by_date')
      .select('date')
      .gte('date', startDate)
      .lte('date', endDate)

    if (data) {
      const datesSet = new Set(data.map(d => d.date))
      setConfiguredDates(datesSet)
    }
  }

  const handleStockChange = (productId, newStock) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: parseInt(newStock) || 0 } : p
    ))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // PRESERVED: Updates both total and remaining stock
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
        alert('Error saving stock: ' + error.message)
      } else {
        alert('Stock updated successfully!')
        fetchInventory()
        fetchConfiguredDates() // Refresh calendar to show the new green day
      }
    } catch (error) {
      console.error('Error saving stock:', error)
      alert('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // --- Calendar Helper Functions ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + offset)
    setCurrentMonth(newDate)
  }

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Inventory Management</h1>
        <button onClick={() => navigate('/admin/dashboard')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>

      {/* --- VISUAL CALENDAR --- */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '30px', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={() => changeMonth(-1)} style={{ cursor: 'pointer', padding: '5px 10px' }}>← Prev</button>
          <h3 style={{ margin: 0 }}>{monthName}</h3>
          <button onClick={() => changeMonth(1)} style={{ cursor: 'pointer', padding: '5px 10px' }}>Next →</button>
        </div>

        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', color: '#6b7280' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <div key={i}>{day}</div>)}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {/* Empty slots for days before the 1st of the month */}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
          
          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = formatDateKey(year, month, day)
            const isConfigured = configuredDates.has(dateKey)
            const isSelected = dateKey === selectedDate

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                style={{
                  padding: '10px 0',
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid transparent',
                  // GREEN if configured, else no color (white)
                  backgroundColor: isConfigured ? '#22c55e' : 'transparent',
                  color: isConfigured ? 'white' : '#1f2937',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}
              >
                {day}
              </div>
            )
          })}
        </div>
        
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '15px', textAlign: 'center' }}>
          🟢 Green = Stock Configured | Click a day to edit
        </p>
      </div>

      {/* --- STOCK INPUT SECTION (PRESERVED LOGIC) --- */}
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
    </div>
  )
}