import { createContext, useState, useContext } from 'react'

// Create the context
const CartContext = createContext()

// Create the Provider (this holds the actual data)
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  const addToCart = (product, date, quantity) => {
    // Rule: One checkout = one delivery date
    if (cartItems.length > 0 && cartItems[0].date !== date) {
      alert("You can only order for one delivery date at a time! Please checkout or clear your cart first.")
      return
    }
    
    // Add the item
    setCartItems([...cartItems, { product, date, quantity }])
    alert(`${product.name} added to cart!`)
  }

  const clearCart = () => setCartItems([])

  return (
    <CartContext.Provider value={{ cartItems, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to easily use the cart in other files
export const useCart = () => useContext(CartContext)