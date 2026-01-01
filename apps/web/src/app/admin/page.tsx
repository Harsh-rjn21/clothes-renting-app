"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

interface Product {
    id: number;
    name: string;
    category: string;
    price_3_days: number;
}

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    
    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Party Wear");
    const [imageUrl, setImageUrl] = useState("");
    const [price1, setPrice1] = useState(0);
    const [price3, setPrice3] = useState(0);
    const [price7, setPrice7] = useState(0);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/catalog/products');
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const res = await fetch(`/api/catalog/products/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchProducts();
            } else {
                alert("Failed to delete product");
            }
        } catch (error) {
            console.error("Error deleting product", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const productData = {
            name,
            description,
            category,
            image_url: imageUrl,
            price_1_day: price1,
            price_3_days: price3,
            price_7_days: price7,
            color,
            size
        };

        try {
            const res = await fetch('/api/catalog/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            if (res.ok) {
                alert("Product Added!");
                setName("");
                setDescription("");
                setImageUrl("");
                fetchProducts();
            } else {
                alert("Failed to add product");
            }
        } catch (error) {
            console.error("Error adding product", error);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add Product Form */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-6">Add New Product</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border">
                                    <option>Party Wear</option>
                                    <option>Traditional</option>
                                    <option>Casual</option>
                                    <option>Accessories</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">1 Day Price</label>
                                    <input type="number" value={price1} onChange={e => setPrice1(parseFloat(e.target.value))} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">3 Day Price</label>
                                    <input type="number" value={price3} onChange={e => setPrice3(parseFloat(e.target.value))} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">7 Day Price</label>
                                    <input type="number" value={price7} onChange={e => setPrice7(parseFloat(e.target.value))} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Color</label>
                                    <input type="text" value={color} onChange={e => setColor(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Size</label>
                                    <input type="text" value={size} onChange={e => setSize(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
                            </div>
                            <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Add Product
                            </button>
                        </form>
                    </div>

                    {/* Manage Products */}
                    <div className="bg-white p-6 rounded-lg shadow">
                         <h2 className="text-xl font-bold mb-6">Manage Inventory</h2>
                         <div className="flow-root">
                            <ul role="list" className="-my-5 divide-y divide-gray-200">
                                {products.map((product) => (
                                    <li key={product.id} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                <p className="text-sm text-gray-500 truncate">{product.category} - ${product.price_3_days}/3d</p>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:text-red-500 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
