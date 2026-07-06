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
      <div style={{ padding: '20px' }}>
        <Link to="/">← Back to Menu</Link>
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <p>Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ padding: '20px' }}>
        <Link to="/">← Back to Menu</Link>
        <div style={{ marginTop: '40px', textAlign: 'center', color: 'red' }}>
          <h2>Product not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* NEW: Inject custom styles for the calendar colors */}
      <style>{`
        .react-datepicker__day--unavailable {
          background-color: #fee2e2 !important;
          color: #ef4444 !important;
          cursor: not-allowed !important;
        }
        .react-datepicker__day--unavailable:hover {
          background-color: #fee2e2 !important;
          color: #ef4444 !important;
        }
        .react-datepicker__day--high-stock {
          background-color: #dcfce7 !important;
          color: #166534 !important;
          font-weight: 600;
        }
        .react-datepicker__day--high-stock:hover {
          background-color: #bbf7d0 !important;
        }
        .react-datepicker__day--low-stock {
          background-color: #fef9c3 !important;
          color: #854d0e !important;
          font-weight: 600;
        }
        .react-datepicker__day--low-stock:hover {
          background-color: #fef08a !important;
        }
        /* Ensure selected day still looks selected */
        .react-datepicker__day--selected.react-datepicker__day--high-stock,
        .react-datepicker__day--selected.react-datepicker__day--low-stock {
          background-color: #22c55e !important;
          color: white !important;
        }
      `}</style>

      <Link to="/">← Back to Menu</Link>
      
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <h3>Price: RM{product.price}</h3>
      <hr />
      
      <h3>Select Delivery Date:</h3>
      
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
        dayClassName={getDayClassName} // NEW: Apply colors
        minDate={new Date()}
        dateFormat="dd/MM/yyyy"
        placeholderText="Select a date"
        style={{ padding: '8px', fontSize: '16px' }}
      />
      
      {selectedDate && (
        <div style={{ marginTop: '20px' }}>
          <p>
            Available Stock: <b>{remainingStock}</b>
            {cartItems.some(item => 
              item.product.id === id && 
              item.date === selectedDate
            ) && (
              <span style={{ color: '#6b7280', fontSize: '14px', display: 'block' }}>
                (You have {cartItems
                  .filter(i => i.product.id === id && i.date === selectedDate)
                  .reduce((s, i) => s + i.quantity, 0)} in your cart)
              </span>
            )}
          </p>
          
          {remainingStock > 0 ? (
            <div>
              <h3>Quantity:</h3>
              <input
                type="number"
                min="1"
                max={remainingStock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <br /><br />
              <button onClick={handleAddToCart}>Add to Cart</button>
            </div>
          ) : (
            <p style={{ color: 'red' }}>Sold Out for this date.</p>
          )}
        </div>
      )}
    </div>
  )
}