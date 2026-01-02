"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

interface Product {
    id: number;
    name: string;
    category: string;
    images: { url: string }[];
    price_1_day: number;
    available: boolean;
}

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);

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
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCategory]);


    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            
            <header className="bg-slate-50 border-b border-slate-100 py-12 md:py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">The Collection</h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto">Discover a curated selection of premium garments for your next unforgettable moment.</p>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category Filter */}
                <div className="flex space-x-2 mb-12 overflow-x-auto pb-4 scrollbar-hide no-scrollbar items-center justify-start md:justify-center">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border-2 ${
                                selectedCategory === cat
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:text-slate-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Curating your style...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                        
                        {products.length === 0 && (
                            <div className="text-center py-32">
                                <span className="text-6xl mb-6 block">👗</span>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
                                <p className="text-slate-500 font-medium">Try checking another category for more styles.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <footer className="py-20 text-center border-t border-slate-50">
                <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">Redefining Fashion Ownership</p>
            </footer>
        </div>
    );
}
