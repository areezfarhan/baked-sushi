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
  const { id } = useParams() // This is a UUID string, NOT an integer
  const { cartItems, addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [remainingStock, setRemainingStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableDates, setAvailableDates] = useState([])

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
        .eq('id', id) // Use UUID directly, no parseInt
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
        .select('date')
        .eq('product_id', id) // Use UUID directly
        .gte('date', today)
        .gt('remaining_stock', 0)

      if (error) {
        console.error('Error fetching available dates:', error)
        return
      }

      if (data) {
        setAvailableDates(data.map(d => d.date))
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
        .eq('product_id', id) // Use UUID directly
        .eq('date', selectedDate)
        .single()

      if (error || !data) {
        console.error('Error fetching stock:', error)
        setRemainingStock(0)
        return
      }

      // Calculate what's already in cart for this product + date
      const cartItemsForThisProduct = cartItems.filter(item => 
        item.product.id === id && item.date === selectedDate
      )
      
      const alreadyInCart = cartItemsForThisProduct.reduce((sum, item) => 
        sum + item.quantity, 0
      )

      // Show available stock (database stock - cart items)
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
      // Re-fetch database stock to prevent race conditions
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
      
      // Calculate what's already in cart
      const existingInCart = cartItems
        .filter(item => item.product.id === id && item.date === selectedDate)
        .reduce((sum, item) => sum + item.quantity, 0)
      
      // Check if we can add this quantity
      const maxCanAdd = databaseStock - existingInCart
      
      if (maxCanAdd <= 0) {
        alert(`Sold Out. You already have ${existingInCart} in cart.`)
        return
      }
      
      if (quantity > maxCanAdd) {
        alert(`You can only add ${maxCanAdd} more. You have ${existingInCart} in cart.`)
        return
      }
      
      // All validations passed - add to cart
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