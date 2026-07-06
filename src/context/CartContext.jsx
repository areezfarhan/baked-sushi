import { createContext, useState, useContext } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  const addToCart = (product, date, quantity, maxAllowed) => {
    if (cartItems.length > 0 && cartItems[0].date !== date) {
      alert("You can only order for one delivery date at a time! Please checkout or clear your cart first.")
      return false
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && item.date === date
    )

    if (existingItemIndex > -1) {
      const currentQuantity = cartItems[existingItemIndex].quantity
      const newTotal = currentQuantity + quantity

      if (newTotal > maxAllowed) {
        alert(`Cannot add ${quantity} more. You already have ${currentQuantity} in cart. Maximum allowed: ${maxAllowed}`)
        return false
      }

      const updatedCart = [...cartItems]
      updatedCart[existingItemIndex].quantity = newTotal
      setCartItems(updatedCart)
      return true
    } else {
      if (quantity > maxAllowed) {
        alert(`Cannot add ${quantity}. Maximum allowed: ${maxAllowed}`)
        return false
      }
      setCartItems([...cartItems, { product, date, quantity }])
      return true
    }
  }

  const clearCart = () => setCartItems([])

  // NEW: Remove entire item from cart
  const removeFromCart = (productId, date) => {
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.product.id === productId && item.date === date))
    )
  }

  // NEW: Decrease quantity by 1 (removes item if it hits 0)
  const decreaseQuantity = (productId, date) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.product.id === productId && item.date === date) {
          return { ...item, quantity: item.quantity - 1 }
        }
        return item
      }).filter(item => item.quantity > 0) // Auto-removes if quantity hits 0
    })
  }

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      clearCart,
      removeFromCart,
      decreaseQuantity
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)