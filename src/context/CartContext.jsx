import { createContext, useState, useContext } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  const addToCart = (product, date, quantity, maxAllowed) => {
    if (cartItems.length > 0 && cartItems[0].date !== date) {
      alert("You can only order for one delivery date at a time!")
      return false
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && item.date === date
    )

    if (existingItemIndex > -1) {
      const currentQuantity = cartItems[existingItemIndex].quantity
      const newTotal = currentQuantity + quantity
      
      // Check if new total exceeds maxAllowed (Database Stock)
      if (newTotal > maxAllowed) {
        alert(`Cannot add ${quantity}. You have ${currentQuantity} in cart. Max allowed: ${maxAllowed}`)
        return false
      }
      
      const updatedCart = [...cartItems]
      updatedCart[existingItemIndex].quantity = newTotal
      setCartItems(updatedCart)
      return true
    } else {
      if (quantity > maxAllowed) {
        alert(`Cannot add ${quantity}. Max allowed: ${maxAllowed}`)
        return false
      }
      
      setCartItems([...cartItems, { product, date, quantity }])
      return true
    }
  }

  const clearCart = () => setCartItems([])

  return (
    <CartContext.Provider value={{ cartItems, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)