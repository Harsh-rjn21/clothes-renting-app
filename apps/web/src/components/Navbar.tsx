"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { CheckoutModal } from './CheckoutModal';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [globalDiscount, setGlobalDiscount] = useState({ percentage: 0, is_active: false });

    const { 
        cartItems, 
        cartType, 
        removeFromCart, 
        getCartTotal, 
        cartCount, 
        warningMessage, 
        setWarningMessage 
    } = useCart();

    // Fetch branding name
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "Rental Rewards";
    const brandFirstLetter = appName.charAt(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setIsAdmin(payload.is_admin === true);
            } catch (e) {
                console.error("Error decoding token", e);
            }
        }

        // Fetch global discount config
        fetch('/api/catalog/global-discount')
            .then(res => res.json())
            .then(data => setGlobalDiscount(data))
            .catch(err => console.error("Error loading global discount", err));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const totalAmount = getCartTotal(globalDiscount.percentage, globalDiscount.is_active);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center space-x-2">
                                <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-150">
                                    <span className="text-white font-black text-xl italic">{brandFirstLetter}</span>
                                </span>
                                <span className="text-xl font-black text-slate-900 tracking-tight">
                                    {appName}
                                </span>
                            </Link>
                            
                            <div className="hidden md:ml-10 md:flex md:space-x-8">
                                <Link href="/catalog" className="text-slate-600 hover:text-indigo-600 px-1 pt-1 text-sm font-semibold transition-colors">
                                    Catalog
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" className="text-indigo-600 hover:text-indigo-700 px-1 pt-1 text-sm font-bold transition-colors">
                                        Admin Panel
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:flex md:items-center md:space-x-6">
                            {/* Cart Toggle Button */}
                            <button 
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 w-5 h-5 bg-indigo-600 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-pulse">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {isLoggedIn ? (
                                <button 
                                    onClick={handleLogout}
                                    className="text-sm font-bold text-slate-600 hover:text-red-600 transition-colors"
                                >
                                    Log out
                                </button>
                            ) : (
                                <>
                                    <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                                        Log in
                                    </Link>
                                    <Link href="/signup" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300">
                                        Join Now
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Buttons */}
                        <div className="flex items-center md:hidden space-x-3">
                            <button 
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 w-5 h-5 bg-indigo-600 text-white font-black text-[10px] rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
                        <div className="px-4 pt-2 pb-6 space-y-2 text-center">
                            <Link href="/catalog" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-bold text-slate-700 hover:bg-slate-50 rounded-lg">
                                Catalog
                            </Link>
                            {isAdmin && (
                                <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    Admin Panel
                                </Link>
                            )}
                            <div className="pt-4 flex flex-col space-y-3">
                                {isLoggedIn ? (
                                    <button 
                                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        className="w-full py-3 text-base font-bold text-red-600 bg-red-50 rounded-lg"
                                    >
                                        Log out
                                    </button>
                                ) : (
                                    <>
                                        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-base font-bold text-slate-700 bg-slate-50 rounded-lg">
                                            Log in
                                        </Link>
                                        <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-base font-bold text-white bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                                            Sign up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Sliding Cart Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
                    <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col transform translate-x-0 transition-transform duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                                <span>Your Cart</span>
                                {cartType && (
                                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                        To {cartType}
                                    </span>
                                )}
                            </h3>
                            <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-full hover:bg-slate-200 text-slate-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-20 space-y-4 text-slate-400">
                                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <p className="font-semibold text-sm">Your cart is empty.</p>
                                    <Link href="/catalog" onClick={() => setIsCartOpen(false)} className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-indigo-700">
                                        Start Browsing
                                    </Link>
                                </div>
                            ) : (
                                cartItems.map((item) => {
                                    // Price calculation for display with discount
                                    let activePrice = item.price;
                                    if (globalDiscount.is_active && globalDiscount.percentage > 0) {
                                        if (item.type === 'rent' && item.rentDays && item.priceRentSubsequent) {
                                            const discountedBase = item.originalPrice * (1 - globalDiscount.percentage / 100);
                                            const addOnDays = Math.max(0, item.rentDays - 3);
                                            activePrice = discountedBase + (addOnDays * item.priceRentSubsequent);
                                        } else {
                                            activePrice = item.originalPrice * (1 - globalDiscount.percentage / 100);
                                        }
                                    }

                                    return (
                                        <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative flex space-x-4">
                                            <img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-200" />
                                            <div className="flex-1 space-y-1">
                                                <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                                                <p className="text-xs text-slate-400 font-semibold uppercase">{item.category}</p>
                                                {item.type === 'rent' && (
                                                    <div className="text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded space-y-0.5">
                                                        <p>📅 <strong>Period:</strong> {item.rentStartDate} to {item.rentEndDate}</p>
                                                        <p>⏱️ <strong>Duration:</strong> {item.rentDays} days</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center space-x-2 pt-1">
                                                    <span className="font-black text-sm text-slate-900">${activePrice.toFixed(2)}</span>
                                                    {activePrice < item.price && (
                                                        <span className="text-xs text-slate-400 line-through">${item.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="absolute top-2 right-2 text-slate-400 hover:text-red-600 p-1"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-500 text-sm">Total Amount</span>
                                    <span className="text-xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsCartOpen(false);
                                        setIsCheckoutOpen(true);
                                    }}
                                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-full text-sm hover:bg-indigo-700 hover:shadow-lg transition-all"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cart Isolation Warning Popup Modal */}
            {warningMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 border border-slate-100">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h4 className="text-md font-black text-slate-800">Cart Separation Warning</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {warningMessage}
                        </p>
                        <div className="flex space-x-2 pt-2">
                            <button 
                                onClick={() => setWarningMessage(null)}
                                className="flex-1 py-2 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    // Custom handler to clear cart and then retry
                                    const savedWarning = warningMessage;
                                    setWarningMessage(null);
                                    removeFromCart(cartItems[0].id); // simple trigger to clear
                                    // Actually clear entire cart
                                    localStorage.removeItem('rental_rewards_cart');
                                    window.location.reload();
                                }}
                                className="flex-1 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mount Checkout & Sizing Dialog */}
            <CheckoutModal 
                isOpen={isCheckoutOpen} 
                onClose={() => setIsCheckoutOpen(false)}
                globalDiscountPercentage={globalDiscount.percentage}
                globalDiscountActive={globalDiscount.is_active}
            />
        </>
    );
};

export default Navbar;
