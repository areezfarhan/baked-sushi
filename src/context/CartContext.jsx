import { createContext, useContext, useState } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [alert, setAlert] = useState(null)
  const [toast, setToast] = useState(null)

  const closeAlert = () => setAlert(null)
  const closeToast = () => setToast(null)

  const addToCart = (product, date, quantity, maxAllowed, variant = null, variantPrice = null) => {
    // Check if cart has items from a different date
    if (cartItems.length > 0 && cartItems[0].date !== date) {
      setAlert({
        message: 'You can only order for one delivery date at a time! Please clear your cart first.',
        type: 'warning'
      })
      return false
    }

    // Determine the price to use (variant price or base product price)
    const itemPrice = variantPrice || product.price

    // Find existing item - now also check for variant match
    const existingItemIndex = cartItems.findIndex(
      (item) => 
        item.product.id === product.id && 
        item.date === date &&
        item.variant === variant
    )

    if (existingItemIndex > -1) {
      // Item exists, update quantity
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
      setToast(`Added ${product.name} to cart!`)
      return true
    } else {
      // New item - add to cart with variant info
      if (quantity > maxAllowed) {
        setAlert({
          message: `Cannot add ${quantity}. Maximum allowed: ${maxAllowed}`,
          type: 'error'
        })
        return false
      }
      
      setCartItems([...cartItems, { 
        product, 
        date, 
        quantity,
        variant,        // NEW: Store which variant was selected
        price: itemPrice // NEW: Store the price for this variant
      }])
      setToast(`Added ${product.name} to cart!`)
      return true
    }
  }

  const clearCart = () => {
    setCartItems([])
    closeAlert()
  }

  // UPDATED: Now also removes by variant
  const removeFromCart = (productId, date, variant = null) => {
    setCartItems(prevItems =>
      prevItems.filter(item => 
        !(item.product.id === productId && item.date === date && item.variant === variant)
      )
    )
  }

  // UPDATED: Now also decreases by variant
  const decreaseQuantity = (productId, date, variant = null) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.product.id === productId && item.date === date && item.variant === variant) {
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
      toast,
      closeToast
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)