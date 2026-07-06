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
                    <Link to="/cart" className="text-text-main hover:text-primary transition-colors flex items-center gap-2 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
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