import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import AlertModal from '../components/AlertModal' // 👈 ADD THIS IMPORT

export default function AdminInventory() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [products, setProducts] = useState([])
  const [configuredDates, setConfiguredDates] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null) // 👈 ADD THIS STATE
  const navigate = useNavigate()

  const closeAlert = () => setAlert(null) // 👈 ADD THIS FUNCTION

  // Get today's date specifically in Kuala Lumpur timezone
  const now = new Date()
  const klString = now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  const klDate = new Date(klString)
  const today = `${klDate.getFullYear()}-${String(klDate.getMonth() + 1).padStart(2, '0')}-${String(klDate.getDate()).padStart(2, '0')}`
  useEffect(() => {
    fetchInventory()
  }, [selectedDate])

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
        .order('name', { ascending: true })

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
        // FIXED: Ensure we use 'stockMap' here, not 'stock'
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
        setAlert({
          message: 'Error saving stock: ' + error.message,
          type: 'error'
        })
      } else {
        // 👈 REPLACE THE ALERT() WITH THIS:
        setAlert({
          message: 'Stock updated successfully!',
          type: 'success'
        })
        fetchInventory()
        fetchConfiguredDates()
      }
    } catch (error) {
      console.error('Error saving stock:', error)
      setAlert({
        message: 'An unexpected error occurred.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-text-main">Inventory</h1>
              <p className="text-sm text-gray-500">Manage daily stock levels</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* --- VISUAL CALENDAR CARD --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="text-lg font-bold text-gray-900">{monthName}</h3>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
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
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`}></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = formatDateKey(year, month, day)
              const isConfigured = configuredDates.has(dateKey)
              const isSelected = dateKey === selectedDate
              const isPast = dateKey < today

              return (
                <div
                  key={dateKey}
                  onClick={() => !isPast && setSelectedDate(dateKey)}
                  className={`
                    aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${isPast
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'cursor-pointer'}
                    ${!isPast && isSelected ? 'ring-2 ring-[#1A237E] ring-offset-2' : ''}
                    ${!isPast && isConfigured
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : !isPast && 'bg-gray-50 text-gray-700 hover:bg-gray-100'}
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
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">Stock Levels</h3>
            <span className="text-sm font-medium text-[#1A237E] bg-[#1A237E]/10 px-3 py-1 rounded-full">
              {selectedDate}
            </span>
          </div>

          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-medium text-gray-900">{product.name}</span>

                {/* Plus/Minus Controls */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => decrementStock(product.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-bold text-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                    className="w-12 text-center p-1 rounded-md bg-transparent focus:ring-0 outline-none font-semibold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => incrementStock(product.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1A237E] text-white hover:bg-[#151a5c] transition-colors font-bold text-lg"
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
            className="w-full bg-[#1A237E] hover:bg-[#151a5c] text-white rounded-xl py-3.5 font-semibold mt-6 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/admin/history')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">History</span>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex flex-col items-center gap-1 text-[#E31E24] px-4 py-2 border-t-2 border-[#E31E24] -mt-3 pt-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-xs font-medium">Inventory</span>
            </button>
          </div>
        </div>
      </nav>
      {/* ... at the very end, before the closing </div>, add: */}
      {alert && (
        <AlertModal
          message={alert.message}
          onClose={closeAlert}
          type={alert.type || 'error'}
        />
      )}
    </div>
  )
}