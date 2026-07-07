import { createContext, useContext, useState } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [alert, setAlert] = useState(null)
  const [toast, setToast] = useState(null) // NEW: Toast state
  
  const closeAlert = () => setAlert(null)
  const closeToast = () => setToast(null) // NEW: Close toast

  const addToCart = (product, date, quantity, maxAllowed) => {
    if (cartItems.length > 0 && cartItems[0].date !== date) {
      setAlert({
        message: 'You can only order for one delivery date at a time! Please clear your cart first.',
        type: 'warning'
      })
      return false
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && item.date === date
    )

    if (existingItemIndex > -1) {
      const currentQuantity = cartItems[existingItemIndex].quantity
      const newTotal = currentQuantity + quantity

      if (newTotal > maxAllowed) {
        setAlert({
          message: `Cannot add ${quantity} more. You already have ${currentQuantity} in cart. Maximum allowed: ${maxAllowed}`,
          type: 'error'
        })
        return false
      }

      const updatedCart = [...cartItems]
      updatedCart[existingItemIndex].quantity = newTotal
      setCartItems(updatedCart)
      
      // NEW: Show success toast
      setToast(`Added ${product.name} To Cart!`)
      return true
    } else {
      if (quantity > maxAllowed) {
        setAlert({
          message: `Cannot add ${quantity}. Maximum allowed: ${maxAllowed}`,
          type: 'error'
        })
        return false
      }
      setCartItems([...cartItems, { product, date, quantity }])
      
      // NEW: Show success toast
      setToast(`Added ${product.name} to cart!`)
      return true
    }
  }

  const clearCart = () => {
    setCartItems([])
    closeAlert()
  }

  const removeFromCart = (productId, date) => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item.product.id === productId && item.date === date))
    )
  }

  const decreaseQuantity = (productId, date) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.product.id === productId && item.date === date) {
          return { ...item, quantity: item.quantity - 1 }
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      decreaseQuantity, 
      clearCart, 
      alert, 
      closeAlert,
      toast,      // NEW
      closeToast  // NEW
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)