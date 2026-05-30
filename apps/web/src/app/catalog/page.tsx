"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

interface Product {
    id: number;
    name: string;
    category: string;
    images: { id: number; url: string; is_primary: boolean }[];
    type: 'rent' | 'buy';
    price_buy?: number;
    price_buy_sale?: number;
    price_rent_3day?: number;
    price_rent_3day_sale?: number;
    price_rent_subsequent?: number;
    available: boolean;
}

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [activeTab, setActiveTab] = useState<'rent' | 'buy'>('rent'); // Rent selected by default
    const [loading, setLoading] = useState(true);
    const [globalDiscount, setGlobalDiscount] = useState({ percentage: 0, is_active: false });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Categories
                const cRes = await fetch('/api/catalog/categories');
                if (cRes.ok) {
                    const cData = await cRes.json();
                    setCategories(["All", ...cData.map((c: any) => c.name)]);
                }

                // Fetch Products
                let url = '/api/catalog/products';
                if (selectedCategory !== "All") {
                    url += `?category=${selectedCategory}`;
                }
                const pRes = await fetch(url);
                if (pRes.ok) {
                    const pData = await pRes.json();
                    setProducts(pData);
                }

                // Fetch Global Discount
                const dRes = await fetch('/api/catalog/global-discount');
                if (dRes.ok) {
                    const dData = await dRes.json();
                    setGlobalDiscount(dData);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCategory]);

    // Client-side filter for Rent vs Buy active tab
    const filteredProducts = products.filter(product => product.type === activeTab);

    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />
            
            <header className="bg-white border-b border-slate-100 py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">The Collection</h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm leading-relaxed">
                        Discover premium designer wear. Choose to rent for special occasions or purchase to own.
                    </p>
                    
                    {/* Rent / Buy Toggle Selector */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200">
                        <button
                            onClick={() => setActiveTab('rent')}
                            className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                activeTab === 'rent'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            To Rent (3 Days)
                        </button>
                        <button
                            onClick={() => setActiveTab('buy')}
                            className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                activeTab === 'buy'
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            To Buy
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Category Filter */}
                <div className="flex space-x-2 mb-10 overflow-x-auto pb-2 scrollbar-hide no-scrollbar items-center justify-start md:justify-center">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap border-2 ${
                                selectedCategory === cat
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Curating your style...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    globalDiscountPercentage={globalDiscount.percentage}
                                    globalDiscountActive={globalDiscount.is_active}
                                />
                            ))}
                        </div>
                        
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100">
                                <span className="text-5xl mb-4 block">👗</span>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">No items found</h3>
                                <p className="text-slate-400 text-sm font-medium">There are currently no items available to {activeTab} in this category.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <footer className="py-16 text-center border-t border-slate-100 bg-white mt-12">
                <p className="text-slate-300 font-black text-[9px] uppercase tracking-[0.3em]">Rental Rewards © 2026. Redefining Fashion Ownership</p>
            </footer>
        </div>
    );
}
