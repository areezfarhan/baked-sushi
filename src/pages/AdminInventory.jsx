import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminInventory() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [products, setProducts] = useState([])
  const [configuredDates, setConfiguredDates] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Calculate today's date string to disable past dates
  const today = new Date().toISOString().split('T')[0]

  // 1. Fetch inventory when selected date changes
  useEffect(() => {
    fetchInventory()
  }, [selectedDate])

  // 2. Fetch calendar highlights when the month changes
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
        .order('name', { ascending: true }) // Sort alphabetically A, B, C

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

  const fetchConfiguredDates = async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

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

  // NEW: Plus and Minus handlers
  const incrementStock = (productId) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: p.stock + 1 } : p
    ))
  }

  const decrementStock = (productId) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
    ))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
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
        fetchConfiguredDates()
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
    <div className="min-h-screen bg-warm-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-main">Inventory</h1>
          <p className="text-sm text-gray-500">Manage daily stock levels</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* --- VISUAL CALENDAR CARD --- */}
        <div className="bg-white p-5 rounded-2xl shadow-soft">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => changeMonth(-1)} 
              className="p-2 rounded-full hover:bg-warm-100 text-text-main transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="text-lg font-bold text-text-main">{monthName}</h3>
            <button 
              onClick={() => changeMonth(1)} 
              className="p-2 rounded-full hover:bg-warm-100 text-text-main transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i}>{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for days before the 1st of the month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`}></div>
            ))}
            
            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = formatDateKey(year, month, day)
              const isConfigured = configuredDates.has(dateKey)
              const isSelected = dateKey === selectedDate
              const isPast = dateKey < today // NEW: Check if date is in the past

              return (
                <div
                  key={dateKey}
                  onClick={() => !isPast && setSelectedDate(dateKey)}
                  className={`
                    aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${isPast 
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                      : 'cursor-pointer'}
                    ${!isPast && isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${!isPast && isConfigured 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : !isPast && 'bg-warm-50 text-text-main hover:bg-gray-200'}
                  `}
                >
                  {day}
                </div>
              )
            })}
          </div>
          
          <p className="text-xs text-gray-400 mt-4 text-center">
            🟢 Green days have stock configured
          </p>
        </div>

        {/* --- STOCK INPUT SECTION --- */}
        <div className="bg-white p-5 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-text-main">Stock Levels</h3>
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {selectedDate}
            </span>
          </div>

          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="flex justify-between items-center p-4 bg-warm-50 rounded-xl border border-gray-100">
                <span className="font-medium text-text-main">{product.name}</span>
                
                {/* NEW: Plus/Minus Controls */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => decrementStock(product.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-warm-50 text-text-main hover:bg-gray-200 transition-colors font-bold text-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                    className="w-12 text-center p-1 rounded-md bg-transparent focus:ring-0 outline-none font-semibold text-text-main [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => incrementStock(product.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary w-full py-3.5 font-semibold mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Stock Levels'
            )}
          </button>
        </div>
      </div>

      {/* Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-text-main px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/admin/history')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-text-main px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs font-medium">History</span>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex flex-col items-center gap-1 text-primary px-4 py-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="text-xs font-medium">Inventory</span>
            </button>
            <button
              onClick={() => { supabase.auth.signOut(); navigate('/admin/login') }}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}