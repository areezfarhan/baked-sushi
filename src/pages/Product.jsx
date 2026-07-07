import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'
import AlertModal from '../components/AlertModal'

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getProteinType = (name) => {
  const lower = name.toLowerCase()
  if (lower.includes('salmon') || lower.includes('tuna')) return 'salmon'
  if (lower.includes('prawn')) return 'prawn'
  if (lower.includes('chicken') || lower.includes('teriyaki')) return 'chicken'
  return 'salmon'
}

export default function Product() {
  const { id } = useParams()
  const { cartItems, addToCart, alert, closeAlert } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [remainingStock, setRemainingStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableDates, setAvailableDates] = useState([])
  const [stockLevels, setStockLevels] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchAvailableDates()
    }
  }, [id])

  useEffect(() => {
    if (selectedDate && product) {
      fetchStockForDate()
    }
  }, [selectedDate, product, cartItems])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } else {
        setProduct(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableDates = async () => {
    if (!id) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('stock_by_date')
        .select('date, remaining_stock')
        .eq('product_id', id)
        .gte('date', today)
        .gt('remaining_stock', 0)

      if (error) {
        console.error('Error fetching available dates:', error)
        return
      }
      if (data) {
        setAvailableDates(data.map(d => d.date))
        const levels = {}
        data.forEach(d => {
          levels[d.date] = d.remaining_stock
        })
        setStockLevels(levels)
      }
    } catch (err) {
      console.error('Unexpected error fetching dates:', err)
    }
  }

  const fetchStockForDate = async () => {
    if (!selectedDate || !id) {
      setRemainingStock(0)
      return
    }
    try {
      const { data, error } = await supabase
        .from('stock_by_date')
        .select('remaining_stock')
        .eq('product_id', id)
        .eq('date', selectedDate)
        .single()

      if (error || !data) {
        setRemainingStock(0)
        return
      }
      const cartItemsForThisProduct = cartItems.filter(item =>
        item.product.id === id && item.date === selectedDate
      )
      const alreadyInCart = cartItemsForThisProduct.reduce((sum, item) =>
        sum + item.quantity, 0
      )
      const availableStock = data.remaining_stock - alreadyInCart
      setRemainingStock(Math.max(0, availableStock))
    } catch (err) {
      console.error('Unexpected error fetching stock:', err)
      setRemainingStock(0)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedDate || !id) {
      alert('Please select a date')
      return
    }
    try {
      const { data: stockData, error } = await supabase
        .from('stock_by_date')
        .select('remaining_stock')
        .eq('product_id', id)
        .eq('date', selectedDate)
        .single()

      if (error || !stockData) {
        alert('Stock information not available.')
        return
      }
      const databaseStock = stockData.remaining_stock
      const existingInCart = cartItems
        .filter(item => item.product.id === id && item.date === selectedDate)
        .reduce((sum, item) => sum + item.quantity, 0)
      const maxCanAdd = databaseStock - existingInCart

      if (maxCanAdd <= 0) {
        alert(`Sold Out. You already have ${existingInCart} in cart.`)
        return
      }
      if (quantity > maxCanAdd) {
        alert(`You can only add ${maxCanAdd} more. You have ${existingInCart} in cart.`)
        return
      }
      addToCart(product, selectedDate, quantity, databaseStock)
    } catch (err) {
      console.error('Error in handleAddToCart:', err)
      alert('Failed to add to cart. Please try again.')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const isKLTimeAfter9AM = () => {
    const now = new Date()
    const klString = now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
    const klTime = new Date(klString)
    return klTime.getHours() >= 9
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E31E24] border-t-transparent"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] p-4 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-[#E31E24] mb-4 font-display">Product not found</h2>
        <Link to="/" className="px-6 py-3 bg-[#1A237E] text-white rounded-2xl font-bold font-display hover:bg-[#1A237E]/90 transition-colors">← Back to Menu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] pb-32">
      {/* Header / Back Button */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#F5F0E6]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="text-[#1A237E] hover:text-[#E31E24] transition-colors flex items-center gap-2 font-bold font-display">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Product Image & Info Card */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-[#F5F0E6] overflow-hidden">
          {/* Image fills the entire width, no padding */}
          <div className="w-full bg-stone-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-stone-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Content below image */}
          <div className="p-5">
            <h1 className="text-3xl font-bold text-[#1A237E] font-display">{product.name}</h1>
            <p className="text-[15px] text-gray-600 mt-4 mb-6 leading-[1.75] font-body">{product.description}</p>

            <div className="mt-6 pt-6 border-t-2 border-[#F5F0E6] flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#E31E24] font-display">RM{Number(product.price).toFixed(2)}</span>
                <span className="text-sm text-gray-500 font-body">• 280g</span>
              </div>
            </div>

            {/* Includes Free Seaweed Note */}
            <div className="mt-4 p-4 bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] rounded-2xl border border-[#F5F0E6] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E31E24]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#E31E24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 font-display">Includes Free Seaweed</p>
                <p className="text-xs text-gray-500 font-body">1x 4g Laverland Crunch (Sea Salt)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white p-5 rounded-3xl shadow-xl border-2 border-[#F5F0E6]">
          <h3 className="text-lg font-bold text-[#1A237E] mb-5 font-display">Select Delivery Date</h3>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-full hover:bg-[#F5F0E6] text-[#1A237E] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h4 className="text-lg font-semibold text-[#1A237E] font-display">{monthName}</h4>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-full hover:bg-[#F5F0E6] text-[#1A237E] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 mb-3 font-display">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`}></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = formatDateKey(year, month, day)
              const isPast = dateKey < today
              const isToday = dateKey === today
              const isAfter9AM = isToday && isKLTimeAfter9AM()
              const hasStock = availableDates.includes(dateKey)
              const stock = stockLevels[dateKey] || 0
              const isSelectable = !isPast && !isAfter9AM && hasStock
              const isSelected = dateKey === selectedDate

              return (
                <div
                  key={dateKey}
                  onClick={() => isSelectable && setSelectedDate(dateKey)}
                  className={`
                    aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all font-display
                    ${!isSelectable ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected ? 'ring-2 ring-[#1A237E] ring-offset-2' : ''}
                    ${isSelectable && stock >= 5 ? 'bg-[#1A237E] text-white hover:bg-[#1A237E]/90' : ''}
                    ${isSelectable && stock < 5 ? 'bg-[#E31E24] text-white hover:bg-[#E31E24]/90' : ''}
                  `}
                >
                  {day}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-gray-500 font-body">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1A237E]"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E31E24]"></div>
              <span>Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        {/* Quantity Section */}
        {selectedDate && (
          <div className="bg-white p-5 rounded-3xl shadow-xl border-2 border-[#F5F0E6] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1A237E] font-display">Quantity</h3>
              <span className="text-sm font-medium text-[#1A237E] bg-[#1A237E]/10 px-3 py-1 rounded-full font-body">
                {selectedDate}
              </span>
            </div>

            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#F5F0E6]">
              {remainingStock > 0 ? (
                <p className="text-gray-700 font-medium font-body">
                  <span className="text-gray-500">Available:</span> <span className="text-[#E31E24] font-bold text-lg ml-1 font-display">{remainingStock} left</span>
                </p>
              ) : (
                <p className="text-[#E31E24] font-bold font-display">Sold Out for this date.</p>
              )}
              {cartItems.some(item => item.product.id === id && item.date === selectedDate) && (
                <p className="text-xs text-gray-500 mt-1 font-body">
                  (You already have {cartItems.filter(i => i.product.id === id && i.date === selectedDate).reduce((s, i) => s + i.quantity, 0)} in your cart)
                </p>
              )}
            </div>

            {remainingStock > 0 && (
              <div className="flex items-center justify-between bg-[#FDFBF7] p-2 rounded-2xl border border-[#F5F0E6]">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-12 h-12 rounded-xl bg-white border border-[#F5F0E6] text-[#1A237E] font-bold text-xl flex items-center justify-center hover:bg-[#F5F0E6] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm font-display"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-[#1A237E] w-12 text-center font-display">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.min(remainingStock, prev + 1))}
                  disabled={quantity >= remainingStock}
                  className="w-12 h-12 rounded-xl bg-[#E31E24] text-white font-bold text-xl flex items-center justify-center hover:bg-[#E31E24]/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm font-display"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {selectedDate && remainingStock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F5F0E6] p-4 shadow-2xl z-20">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#E31E24] text-white py-4 text-lg font-bold flex items-center justify-center gap-2 rounded-2xl hover:bg-[#C41820] transition-colors shadow-lg font-display"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Add to Cart • RM{(product.price * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* Alert Modal */}
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