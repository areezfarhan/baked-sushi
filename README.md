Here's a professional README.md for your Baked Sushi project:

```markdown
# WARISAN OPAH ARTISAN KITCHEN

A modern, full-stack e-commerce web application for a premium sushi delivery service. Built with React and Supabase, featuring real-time inventory management, secure payment verification, and a seamless customer experience.

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### Customer-Facing
- 🛍️ **Product Catalog** - Browse premium sushi products with beautiful imagery
- 🛒 **Shopping Cart** - Add items, adjust quantities, and manage orders
- 📅 **Date Selection** - Choose delivery dates based on real-time stock availability
- 💳 **Secure Checkout** - Upload payment receipts for admin verification
- 📱 **Order Confirmation** - Instant confirmation with order details and reference number
- 📲 **WhatsApp Integration** - Direct communication channel with the business
- 💾 **Download Receipt** - Save order details as PNG image for records

### Admin Dashboard
- 📊 **Order Management** - View, approve, or reject pending orders
- 📦 **Inventory Control** - Manage stock levels by date and product
- 📈 **Revenue Tracking** - View total revenue with monthly breakdowns
- 🗑️ **Order History** - Browse past orders with search and filter capabilities
- 📥 **CSV Export** - Export order data for accounting purposes
- 📍 **Delivery Tracking** - View customer addresses for delivery orders
- 📞 **Quick Contact** - One-click WhatsApp messaging to customers

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations and transitions

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (admin login)
  - Storage (receipt uploads)
  - Real-time subscriptions
  - Edge Functions (email notifications)

### Deployment
- **Vercel** - Frontend hosting and deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/baked-sushi.git
cd baked-sushi
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Database Setup

The application requires the following Supabase tables:
- `products` - Product catalog
- `inventory` - Stock levels by date
- `orders` - Customer orders
- `order_items` - Order line items
- `categories` - Product categories (optional)

Refer to the `build-guide-from-scratch.pdf` for detailed database schema.

## 📁 Project Structure

```
baked-sushi/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── context/         # React Context (Cart, Auth)
│   ├── lib/             # Supabase client configuration
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## 🎨 Design Philosophy

- **Mobile-First** - Optimized for smartphone users
- **Premium Aesthetic** - Warm, creamy color palette with elegant typography
- **Smooth Animations** - Subtle transitions for enhanced UX
- **Accessibility** - Semantic HTML and ARIA labels
- **Performance** - Fast load times with Vite's optimized builds

## 🔐 Security Features

- Secure admin authentication via Supabase Auth
- Receipt upload validation
- SQL injection protection (Supabase parameterized queries)
- Input sanitization on all forms
- Protected admin routes

## 📱 Key Features Explained

### Timezone Handling
The application uses `Asia/Kuala_Lumpur` timezone for all date calculations, ensuring accurate stock availability and order cutoff times (9 AM daily).

### Order Workflow
1. Customer places order → Status: `pending_verification`
2. Admin reviews receipt → Approve or Reject
3. If approved → Status: `payment_confirmed`, stock is deducted
4. If rejected → Status: `rejected`, stock is restored

### Inventory Management
Stock is tracked per product per date, allowing the business to control daily production capacity and prevent overselling.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The site will automatically redeploy on every push to the main branch.

## 📝 Future Enhancements

- [ ] Multi-category product support (Rice bowls, Meat, etc.)
- [ ] Customer account and order history
- [ ] Email notifications for order status updates
- [ ] Admin analytics dashboard with charts
- [ ] Promo codes and discounts
- [ ] Product reviews and ratings

## 👨‍💻 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## 📄 License

This project is proprietary software created for Opah's Cafe.

## 🤝 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for Opah's Cafe**
```

This README covers all the key aspects of your project and presents it professionally. Feel free to customize the badges, links, or any sections to match your preferences!
