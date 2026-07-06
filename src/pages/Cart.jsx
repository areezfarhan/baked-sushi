import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

export default function Cart() {
  const { cartItems, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Your Cart is Empty</h1>
        <Link to="/">
          <button style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px'
          }}>
            Go back to Menu
          </button>
        </Link>
      </div>
    )
  }

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return (
    <div style={{ padding: '20px' }}>
      {/* Back to Menu Button */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <button style={{
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '20px',
          background: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}>
          ← Back to Menu
        </button>
      </Link>

      <h1>Your Cart</h1>
      <p>Delivery Date: {cartItems[0].date}</p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cartItems.map((item, index) => (
          <li key={index} style={{
            border: '1px solid #e5e7eb',
            padding: '15px',
            marginBottom: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{item.product.name}</strong>
              <span>RM{item.product.price * item.quantity}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Quantity: {item.quantity}
            </div>
          </li>
        ))}
      </ul>

      <h3>Total: RM{total}</h3>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={clearCart}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            marginRight: '10px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Clear Cart
        </button>

        <Link to="/checkout" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}>
            Proceed to Checkout
          </button>
        </Link>
      </div>
    </div>
  )
}