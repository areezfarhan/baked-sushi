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
      <header className="bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#F5F0E6]">
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          {/* LOGO */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/navbar_logo.png" 
              alt="Opah's Cafe Logo" 
              className="h-10 w-auto object-contain md:h-12" 
            />
          </Link>
          
          {/* Cart Link */}
          <Link to="/cart" className="text-[#1A237E] hover:text-[#E31E24] transition-colors flex items-center gap-2 font-bold font-display">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-base md:text-lg">Cart</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-6 md:px-8 md:py-10">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-[#F5F0E6] border-t border-[#E6DCC8] py-6 md:py-8 text-center text-gray-500 text-xs md:text-sm font-body">
        <p>© {new Date().getFullYear()} Warisan Opah's Kitchen. All rights reserved.</p>
      </footer>
    </div>
  );
}