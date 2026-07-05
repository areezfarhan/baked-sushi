import { useParams, Link } from 'react-router-dom'

export default function Confirmation() {
  // Get the order reference from the URL
  const { ref } = useParams()

  // Replace this with your actual WhatsApp number (include country code, no + or spaces)
  // Example: 60123456789
  const adminPhone = "60123456789" 
  
  const message = `I have ordered, thank you — Order Ref: ${ref}`
  const waLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Order Successful!</h1>
      <p>Thank you for your order! Your payment is currently being verified.</p>
      <p>You will receive a WhatsApp confirmation once your payment has been approved.</p>
      
      <hr />
      
      <h3>Your Order Reference:</h3>
      <h2 style={{ color: 'blue' }}>{ref}</h2>
      <p><i>Please save this reference number.</i></p>
      
      <hr />
      
      <p>Want to let us know you've ordered?</p>
      <a href={waLink} target="_blank" rel="noopener noreferrer">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>
          Message us on WhatsApp
        </button>
      </a>
      
      <br /><br />
      <Link to="/">Return to Menu</Link>
    </div>
  )
}