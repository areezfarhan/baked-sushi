import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
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
  if (lower.includes('beef') || lower.includes('daging')) return 'beef'
  return 'salmon'
}

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cartItems, addToCart } = useCart()
  const [alert, setAlert] = useState(null)
  const closeAlert = () => setAlert(null)
  const [product, setProduct] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [remainingStock, setRemainingStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableDates, setAvailableDates] = useState([])
  const [stockLevels, setStockLevels] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category') || 'sushi'

  // State for handling variants
  const [selectedVariant, setSelectedVariant] = useState(null)

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
  }, [selectedDate, product, cartItems, selectedVariant])

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
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        } else {
          setSelectedVariant(null)
        }
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
      const now = new Date()
      const klString = now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
      const klDate = new Date(klString)
      const today = `${klDate.getFullYear()}-${String(klDate.getMonth() + 1).padStart(2, '0')}-${String(klDate.getDate()).padStart(2, '0')}`

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
        .select('remaining_stock, variant_stock')
        .eq('product_id', id)
        .eq('date', selectedDate)
        .single()

      if (error || !data) {
        setRemainingStock(0)
        return
      }

      let baseStock = data.remaining_stock
      if (selectedVariant && data.variant_stock) {
        const variantStock = data.variant_stock[selectedVariant.name]
        if (variantStock !== undefined) {
          baseStock = variantStock
        }
      }

      const cartItemsForThisProduct = cartItems.filter(item =>
        item.product.id === id &&
        item.date === selectedDate &&
        (selectedVariant ? item.variant === selectedVariant.name : true)
      )
      const alreadyInCart = cartItemsForThisProduct.reduce((sum, item) =>
        sum + item.quantity, 0
      )
      const availableStock = baseStock - alreadyInCart
      setRemainingStock(Math.max(0, availableStock))
    } catch (err) {
      console.error('Unexpected error fetching stock:', err)
      setRemainingStock(0)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedDate || !id) {
      setAlert({ message: 'Please select a date', type: 'warning' })
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
        setAlert({ message: 'Stock information not available.', type: 'error' })
        return
      }

      let databaseStock = stockData.remaining_stock
      if (selectedVariant && product?.variants && product.variants.length > 0) {
        const variantData = product.variants.find(v => v.name === selectedVariant.name)
        if (variantData && variantData.stock !== undefined) {
          databaseStock = variantData.stock
        }
      }

      const existingInCart = cartItems
        .filter(item =>
          item.product.id === id &&
          item.date === selectedDate &&
          (selectedVariant ? item.variant === selectedVariant.name : true)
        )
        .reduce((sum, item) => sum + item.quantity, 0)

      const maxCanAdd = databaseStock - existingInCart
      if (maxCanAdd <= 0) {
        setAlert({ message: `Sold Out. You already have ${existingInCart} in cart.`, type: 'warning' })
        return
      }
      if (quantity > maxCanAdd) {
        setAlert({ message: `You can only add ${maxCanAdd} more. You have ${existingInCart} in cart.`, type: 'warning' })
        return
      }

      addToCart(
        product,
        selectedDate,
        quantity,
        databaseStock,
        selectedVariant?.name,
        selectedVariant?.price || product.price
      )
      setRemainingStock(prev => prev - quantity)
    } catch (err) {
      console.error('Error in handleAddToCart:', err)
      setAlert({ message: 'Failed to add to cart. Please try again.', type: 'error' })
    }
  }

  const now = new Date()
  const klString = now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  const klDate = new Date(klString)
  const today = `${klDate.getFullYear()}-${String(klDate.getMonth() + 1).padStart(2, '0')}-${String(klDate.getDate()).padStart(2, '0')}`

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

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price;
  const weightText = product?.category === 'sushi' ? '280g' : (product?.name === 'Baked Potato Salad' ? '700g' : '11 Inch');

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-warm-100 p-4 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-primary mb-6 font-display">Product not found</h2>
        <Link to="/" className="btn-primary">← Back to Menu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto bg-warm-100/50 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden pb-32">
      {/* Header */}
      <header className="bg-warm-50/80 backdrop-blur-md sticky top-0 z-10 border-b border-warm-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center">
          <Link to={`/?category=${category}`} className="text-primary hover:text-accent transition-colors flex items-center gap-2 font-bold font-display text-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Product Card */}
        <div className="bg-warm-50 rounded-3xl shadow-elevated border-2 border-warm-200 overflow-hidden">
          <div className="w-full bg-warm-100">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-auto object-contain" />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-text-muted">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-5 md:p-8">
            {/* Title uses font-display (Playfair Display) */}
            <h1 className="text-4xl md:text-5xl font-bold text-primary font-display leading-tight">{product.name}</h1>
            {/* Description uses font-body (Lato) */}
            <p className="text-sm md:text-lg text-text-body max-w-md mx-auto font-body leading-loose px-0 md:px-0">{product.description}</p>

            <div className="mt-6 pt-6 border-t-2 border-warm-200 flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-accent font-display">RM{Number(currentPrice).toFixed(2)}</span>
                <span className="text-sm md:text-base text-text-muted font-body">• {weightText}</span>
              </div>
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4 font-display">Choose Your Variant</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.name}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full py-3 px-2 rounded-xl font-bold text-sm md:text-base transition-all font-body border-2 flex items-center justify-center gap-2 ${selectedVariant?.name === variant.name
                          ? 'bg-primary text-warm-50 border-primary shadow-md'
                          : 'bg-warm-50 text-primary border-warm-200 hover:border-primary'
                        }`}
                    >
                      <span>{variant.name}</span>
                      <span className="opacity-80 text-xs md:text-sm">RM{variant.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seaweed Note */}
            {product.category === 'sushi' && (
              <div className="mt-6 p-4 md:p-5 bg-gradient-to-r from-warm-50 to-warm-200 rounded-2xl border border-warm-200 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-text-main font-display">Includes Free Seaweed</p>
                  <p className="text-sm text-text-muted font-body">1x 4g Laverland Crunch (Sea Salt)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar & Quantity Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar Section */}
          <div className={`bg-warm-50 p-5 md:p-8 rounded-3xl shadow-elevated border-2 border-warm-200 ${selectedDate ? 'w-full md:w-2/3' : 'w-full'}`}>
            <h3 className="text-2xl md:text-3xl font-bold text-primary mb-6 font-display">Select Delivery Date</h3>

            <div className="flex justify-between items-center mb-6">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-warm-200 text-primary transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h4 className="text-xl md:text-2xl font-semibold text-primary font-display">{monthName}</h4>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-warm-200 text-primary transition-colors">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3 text-center text-xs md:text-sm font-semibold text-text-muted mb-3 font-body">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3">
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
                    onClick={() => {
                      if (!isSelectable) return
                      if (cartItems.length > 0) {
                        const cartDates = [...new Set(cartItems.map(item => item.date))]
                        if (cartDates.length > 0 && !cartDates.includes(dateKey)) {
                          setAlert({
                            message: 'You can only order for one delivery date at a time! Please clear your cart first or complete your current order.',
                            type: 'warning'
                          })
                          return
                        }
                      }
                      setSelectedDate(dateKey)
                    }}
                    className={`
                      aspect-square flex items-center justify-center rounded-xl text-sm md:text-base font-medium transition-all font-body
                      ${!isSelectable ? 'bg-warm-200 text-text-light cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-warm-50' : ''}
                      ${isSelectable && stock >= 5 ? 'bg-primary text-warm-50 hover:bg-primary-dark' : ''}
                      ${isSelectable && stock < 5 ? 'bg-accent text-warm-50 hover:bg-accent-dark' : ''}
                    `}
                  >
                    {day}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs md:text-sm text-text-muted font-body">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span>Low Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warm-200"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>

          {/* Quantity Section */}
          {selectedDate && (
            <div className="w-full md:w-1/3 bg-warm-50 p-5 md:p-8 rounded-3xl shadow-elevated border-2 border-warm-200 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl md:text-3xl font-bold text-primary font-display">Quantity</h3>
                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full font-body">
                  {selectedDate}
                </span>
              </div>

              <div className="bg-warm-100 p-4 rounded-2xl border border-warm-200">
                {remainingStock > 0 ? (
                  <p className="text-text-main font-medium font-display">
                    <span className="text-text-muted">Available:</span>
                    <span className="text-accent font-bold text-xl ml-1">{remainingStock} left</span>
                  </p>
                ) : (
                  <p className="text-accent font-bold font-display">Sold Out for this date.</p>
                )}
                {cartItems.some(item => item.product.id === id && item.date === selectedDate) && (
                  <p className="text-xs text-text-muted mt-1 font-body">
                    (You already have {cartItems.filter(i => i.product.id === id && i.date === selectedDate).reduce((s, i) => s + i.quantity, 0)} in your cart)
                  </p>
                )}
              </div>

              {remainingStock > 0 && (
                <div className="flex items-center justify-between bg-warm-100 p-2 rounded-2xl border border-warm-200">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-warm-50 border border-warm-200 text-primary font-bold text-xl flex items-center justify-center hover:bg-warm-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-soft font-display"
                  >
                    −
                  </button>
                  <span className="text-2xl md:text-3xl font-bold text-primary w-12 text-center font-display">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(remainingStock, prev + 1))}
                    disabled={quantity >= remainingStock}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary text-warm-50 font-bold text-xl flex items-center justify-center hover:bg-primary-dark active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-soft font-display"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      {selectedDate && remainingStock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-warm-50 border-t-2 border-warm-200 p-4 md:p-6 shadow-elevated z-20">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary text-warm-50 py-4 md:py-5 text-lg md:text-xl font-bold flex items-center justify-center gap-2 rounded-2xl hover:bg-primary-dark transition-colors shadow-warm font-display"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Add to Cart • RM{(currentPrice * quantity).toFixed(2)}
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