"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

interface Product {
    id: number;
    name: string;
    category: string;
    image_url?: string;
    price_1_day: number;
    price_3_days: number;
    price_7_days: number;
    available: boolean;
}

const categories = ["All", "Party Wear", "Traditional", "Casual", "Accessories"];

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetching from localhost:8002 via browser
                let url = '/api/catalog/products';
                if (selectedCategory !== "All") {
                    url += `?category=${selectedCategory}`;
                }
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategory]);

    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-6">Our Collection</h2>
                
                {/* Category Filter */}
                <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                                selectedCategory === cat
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
                {products.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-500">No products found in this category.</div>
                )}
            </div>
        </div>
    );
}
