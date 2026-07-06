import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Don't apply the customer layout to admin pages
  if (isAdmin) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple, elegant Navbar */}
      <header className="bg-warm-50/80 backdrop-blur-md sticky top-0 z-50 border-b border-warm-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            Baked Sushi
          </Link>
          <Link to="/cart" className="text-text-main hover:text-primary transition-colors">
            Cart
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-warm-100 border-t border-warm-200 py-6 text-center text-text-muted text-sm">
        <p>© {new Date().getFullYear()} Baked Sushi. All rights reserved.</p>
      </footer>
    </div>
  );
}