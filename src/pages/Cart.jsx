import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

export default function Cart() {
  const { cartItems, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <div>
        <h1>Your Cart is Empty</h1>
        <Link to="/">Go back to Menu</Link>
      </div>
    )
  }

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return (
    <div>
      <h1>Your Cart</h1>
      <p>Delivery Date: {cartItems[0].date}</p>
      
      <ul>
        {cartItems.map((item, index) => (
          <li key={index}>
            {item.product.name} x {item.quantity} = RM{item.product.price * item.quantity}
          </li>
        ))}
      </ul>
      
      <h3>Total: RM{total}</h3>
      
      <button onClick={clearCart}>Clear Cart</button>
      <br /><br />
      
      <Link to="/checkout">
        <button>Proceed to Checkout</button>
      </Link>
    </div>
  )
}