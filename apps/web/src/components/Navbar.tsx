"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-black text-xl italic">S</span>
                            </span>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                Style<span className="text-indigo-600">Rent</span>
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

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
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
    );
};

export default Navbar;
