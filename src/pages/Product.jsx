import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Product() {
  const { id } = useParams()
  const { cartItems, addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [remainingStock, setRemainingStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableDates, setAvailableDates] = useState([])
  // NEW: Track exact stock levels for coloring
  const [stockLevels, setStockLevels] = useState({})

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
      // UPDATED: Fetch both date and remaining_stock
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
        // Keep the array for the filter logic (preserves existing progress)
        setAvailableDates(data.map(d => d.date))
        // NEW: Create a map of date -> stock for coloring
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
        console.error('Error fetching stock:', error)
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

  const isDateDisabled = (date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const klTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }))
    const isAfter9AM = klTime.getHours() >= 9

    if (isToday && isAfter9AM) return true
    const dateString = formatDate(date)
    return !availableDates.includes(dateString)
  }

  // NEW: Logic for coloring the calendar days
  const getDayClassName = (date) => {
    const dateString = formatDate(date)
    const todayStr = new Date().toISOString().split('T')[0]
    // Don't color past dates (they are already disabled/greyed out by default)
    if (dateString < todayStr) return ''
    // If date has no stock, make it reddish
    if (!availableDates.includes(dateString)) {
      return 'react-datepicker__day--unavailable'
    }
    // Color based on stock level
    const stock = stockLevels[dateString]
    if (stock >= 5) return 'react-datepicker__day--high-stock' // Green
    return 'react-datepicker__day--low-stock' // Yellow (1-4)
  }

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Link to="/" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1">← Back to Menu</Link>
        <div className="mt-20 text-center">
          <p className="text-text-muted">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Link to="/" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1">← Back to Menu</Link>
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-red-500">Product not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      {/* Inject custom styles for the calendar colors and theme */}
      <style>{`
        /* Base Datepicker styling to match warm theme */
        .react-datepicker { font-family: inherit; border: 1px solid #E6DCC8; border-radius: 12px; box-shadow: 0 4px 20px -2px rgba(166, 94, 68, 0.1); }
        .react-datepicker__header { background-color: #FDFBF7; border-bottom: 1px solid #E6DCC8; border-top-left-radius: 12px; border-top-right-radius: 12px; }
        .react-datepicker__current-month { color: #2C2A29; font-weight: 600; }
        .react-datepicker__day-name { color: #7A7571; }
        .react-datepicker__day { color: #2C2A29; border-radius: 8px; }
        .react-datepicker__day:hover { background-color: #F5F0E6; }
        
        /* Stock Colors */
        .react-datepicker__day--unavailable { background-color: #fee2e2 !important; color: #ef4444 !important; cursor: not-allowed !important; text-decoration: line-through; }
        .react-datepicker__day--unavailable:hover { background-color: #fee2e2 !important; }
        .react-datepicker__day--high-stock { background-color: #dcfce7 !important; color: #166534 !important; font-weight: 600; }
        .react-datepicker__day--high-stock:hover { background-color: #bbf7d0 !important; }
        .react-datepicker__day--low-stock { background-color: #fef9c3 !important; color: #854d0e !important; font-weight: 600; }
        .react-datepicker__day--low-stock:hover { background-color: #fef08a !important; }
        
        /* Selected State - Use Brand Primary Color */
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
          background-color: #A65E44 !important;
          color: white !important;
        }
        .react-datepicker__day--selected:hover, .react-datepicker__day--keyboard-selected:hover {
          background-color: #8A4B35 !important;
        }
      `}</style>

      <Link to="/" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1">← Back to Menu</Link>

      {/* Product Header & Image */}
      <div className="mt-6">
        {/* Image Area: Shows real image if available, otherwise a darker placeholder */}
        <div className="h-64 w-full rounded-2xl bg-stone-200 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-text-main mt-6">{product.name}</h1>
        <p className="text-text-muted mt-2 leading-relaxed">{product.description}</p>
        <h3 className="text-2xl font-bold text-primary mt-4">RM{product.price}</h3>
      </div>

      <hr className="border-warm-200 my-8" />

      {/* Date Picker Section */}
      <h3 className="text-lg font-semibold text-text-main mb-3">Select Delivery Date:</h3>
      <DatePicker
        selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : null}
        onChange={(date) => {
          if (date) {
            const dateString = formatDate(date)
            setSelectedDate(dateString)
            setQuantity(1)
          }
        }}
        filterDate={(date) => !isDateDisabled(date)}
        dayClassName={getDayClassName}
        minDate={new Date()}
        dateFormat="dd/MM/yyyy"
        placeholderText="Select a date"
        className="input-field w-full"
        wrapperClassName="w-full block"
      />

      {/* Stock and Quantity Section */}
      {selectedDate && (
        <div className="mt-8 space-y-6">
          <div className="bg-warm-100 p-4 rounded-xl border border-warm-200">
            <p className="text-text-main">
              Available Stock: <b className="text-primary text-lg">{remainingStock}</b>
              {cartItems.some(item =>
                item.product.id === id &&
                item.date === selectedDate
              ) && (
                  <span className="block text-sm text-text-muted mt-1">
                    (You have {cartItems
                      .filter(i => i.product.id === id && i.date === selectedDate)
                      .reduce((s, i) => s + i.quantity, 0)} in your cart)
                  </span>
                )}
            </p>
          </div>

          {remainingStock > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-main">Quantity:</h3>
              <div className="flex items-center gap-3">
                {/* Minus Button */}
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-11 h-11 rounded-xl bg-warm-100 border border-warm-200 text-text-main font-bold text-xl flex items-center justify-center transition-all duration-200 hover:bg-warm-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>

                {/* Quantity Display */}
                <input
                  type="number"
                  min="1"
                  max={remainingStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    if (val >= 1 && val <= remainingStock) setQuantity(val)
                  }}
                  className="input-field w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {/* Plus Button */}
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.min(remainingStock, prev + 1))}
                  disabled={quantity >= remainingStock}
                  className="w-11 h-11 rounded-xl bg-primary text-white font-bold text-xl flex items-center justify-center transition-all duration-200 hover:bg-primary-dark active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary w-full mt-4">
                Add to Cart
              </button>
            </div>
          ) : (
            <p className="text-red-500 font-medium">Sold Out for this date.</p>
          )}
        </div>
      )}
    </div>
  )
}