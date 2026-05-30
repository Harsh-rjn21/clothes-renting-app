"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';

interface Category {
    id: number;
    name: string;
}

interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
}

interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    images: ProductImage[];
    type: 'rent' | 'buy';
    price_buy?: number;
    price_buy_sale?: number;
    price_rent_3day?: number;
    price_rent_3day_sale?: number;
    price_rent_subsequent?: number;
    available: boolean;
    color: string;
    size: string;
}

interface User {
    id: number;
    email: string;
    full_name: string;
    is_admin: boolean;
}

interface Review {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    original_rating: number;
    comment: string;
    original_comment: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'products' | 'users' | 'reviews' | 'blocks' | 'categories' | 'discounts'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Product Form States
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Party Wear");
    const [productType, setProductType] = useState<'rent' | 'buy'>('rent');
    const [priceBuy, setPriceBuy] = useState(0);
    const [priceBuySale, setPriceBuySale] = useState(0);
    const [priceRent3Day, setPriceRent3Day] = useState(0);
    const [priceRent3DaySale, setPriceRent3DaySale] = useState(0);
    const [priceRentSubsequent, setPriceRentSubsequent] = useState(0);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    // Category Form State
    const [newCategoryName, setNewCategoryName] = useState("");

    // Date Block State
    const [blockProductId, setBlockProductId] = useState("");
    const [blockStart, setBlockStart] = useState("");
    const [blockEnd, setBlockEnd] = useState("");

    // Global Discount State
    const [globalDiscountPercentage, setGlobalDiscountPercentage] = useState(0);
    const [globalDiscountActive, setGlobalDiscountActive] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.is_admin) {
                    setIsAdmin(true);
                    fetchData();
                } else {
                    window.location.href = '/';
                }
            } catch (e) {
                window.location.href = '/login';
            }
        } else {
            window.location.href = '/login';
        }
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [pRes, uRes, rRes, cRes, dRes] = await Promise.all([
                fetch('/api/catalog/products', { headers }),
                fetch('/api/auth/users', { headers }),
                fetch('/api/feedback/reviews', { headers }),
                fetch('/api/catalog/categories', { headers }),
                fetch('/api/catalog/global-discount', { headers })
            ]);
            
            if (pRes.ok) setProducts(await pRes.ok ? await pRes.json() : []);
            if (uRes.ok) setUsers(await uRes.json());
            if (rRes.ok) setReviews(await rRes.json());
            if (cRes.ok) {
                const cats = await cRes.json();
                setCategories(cats);
                if (cats.length > 0 && !category) {
                    setCategory(cats[0].name);
                }
            }
            if (dRes.ok) {
                const discount = await dRes.json();
                setGlobalDiscountPercentage(discount.percentage);
                setGlobalDiscountActive(discount.is_active);
            }
        } catch (error) {
            console.error("Error fetching admin data", error);
        }
    };

    const resetProductForm = () => {
        setEditingProduct(null);
        setName("");
        setDescription("");
        setCategory(categories[0]?.name || "Party Wear");
        setProductType('rent');
        setPriceBuy(0);
        setPriceBuySale(0);
        setPriceRent3Day(0);
        setPriceRent3DaySale(0);
        setPriceRentSubsequent(0);
        setColor("");
        setSize("");
        setIsAvailable(true);
        setSelectedFiles([]);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = { 
            name, 
            description, 
            category, 
            type: productType,
            price_buy: productType === 'buy' ? priceBuy : null,
            price_buy_sale: productType === 'buy' && priceBuySale ? priceBuySale : null,
            price_rent_3day: productType === 'rent' ? priceRent3Day : null,
            price_rent_3day_sale: productType === 'rent' && priceRent3DaySale ? priceRent3DaySale : null,
            price_rent_subsequent: productType === 'rent' ? priceRentSubsequent : null,
            color, 
            size,
            available: isAvailable
        };
        
        const url = editingProduct ? `/api/catalog/products/${editingProduct.id}` : '/api/catalog/products';
        const method = editingProduct ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const savedProduct = await res.json();
                
                // Handle image uploads
                if (selectedFiles.length > 0) {
                    setUploading(true);
                    for (const file of selectedFiles) {
                        const formData = new FormData();
                        formData.append('file', file);
                        await fetch(`/api/catalog/products/${savedProduct.id}/images/upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                    }
                    setUploading(false);
                }

                alert(editingProduct ? "Product Updated!" : "Product Added!");
                resetProductForm();
                fetchData();
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to save product");
            }
        } catch (err) {
            console.error(err);
            setUploading(false);
        }
    };

    const startEditing = (p: Product) => {
        setEditingProduct(p);
        setName(p.name);
        setDescription(p.description);
        setCategory(p.category);
        setProductType(p.type);
        setPriceBuy(p.price_buy || 0);
        setPriceBuySale(p.price_buy_sale || 0);
        setPriceRent3Day(p.price_rent_3day || 0);
        setPriceRent3DaySale(p.price_rent_3day_sale || 0);
        setPriceRentSubsequent(p.price_rent_subsequent || 0);
        setColor(p.color);
        setSize(p.size);
        setIsAvailable(p.available);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/catalog/products/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchData();
    };

    const handleBlockDates = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch('/api/rental/blocks', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: parseInt(blockProductId),
                start_date: blockStart,
                end_date: blockEnd
            })
        });
        if (res.ok) {
            alert("Dates Blocked!");
            setBlockStart("");
            setBlockEnd("");
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to block dates");
        }
    };

    const handleRevertReview = async (id: number) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/feedback/reviews/${id}/revert`, { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchData();
    };

    const handleDeleteReview = async (id: number) => {
        if (!confirm("Delete this review?")) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/feedback/reviews/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchData();
    };

    const handleUpdateReview = async (r: Review) => {
        const newComment = prompt("Edit review comment:", r.comment);
        if (newComment === null) return;
        
        const newRatingStr = prompt("Edit rating (1-5):", r.rating.toString());
        if (newRatingStr === null) return;
        const newRating = parseInt(newRatingStr);

        const token = localStorage.getItem('token');
        const res = await fetch(`/api/feedback/reviews/${r.id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comment: newComment, rating: newRating })
        });
        if (res.ok) fetchData();
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch('/api/catalog/categories', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newCategoryName })
        });
        if (res.ok) {
            setNewCategoryName("");
            fetchData();
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to add category");
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Delete this category?")) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/catalog/categories/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchData();
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to delete category");
        }
    };

    const handleSaveGlobalDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const res = await fetch('/api/catalog/global-discount', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                percentage: globalDiscountPercentage,
                is_active: globalDiscountActive
            })
        });
        if (res.ok) {
            alert("Global store discount updated successfully!");
            fetchData();
        } else {
            alert("Failed to update global discount.");
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <Navbar />
            
            <header className="bg-white border-b border-slate-200 py-10 mb-8">
                <div className="max-w-7xl mx-auto px-4 md:flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h1>
                        <p className="text-slate-500 font-bold text-sm tracking-tight">Managing StyleRent Platform</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-2">
                         <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-green-700 text-xs font-black uppercase tracking-widest">Systems Online</span>
                         </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4">
                
                {/* Responsive Tabs */}
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-wrap">
                    {([
                        { id: 'products', name: 'Products' },
                        { id: 'categories', name: 'Categories' },
                        { id: 'discounts', name: 'Discounts' },
                        { id: 'reviews', name: 'Reviews' },
                        { id: 'blocks', name: 'Date Blocks' },
                        { id: 'users', name: 'Users' }
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {activeTab === 'products' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-5">
                            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {editingProduct ? 'Update Collection Item' : 'New Collection Item'}
                                </h2>
                                <form onSubmit={handleSaveProduct} className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Product Name</label>
                                        <input placeholder="Ex: Regal Bridal Lehenga" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required />
                                    </div>
                                    
                                    {/* Category */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Category</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm appearance-none">
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Type Toggle: Rent vs Buy */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1 block mb-1">Transaction Mode</label>
                                        <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setProductType('rent')}
                                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${productType === 'rent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                To Rent
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProductType('buy')}
                                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${productType === 'buy' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                To Buy
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pricing Fields depending on type */}
                                    {productType === 'buy' ? (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-150">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Retail Price ($)</label>
                                                <input type="number" step="0.01" placeholder="Original" value={priceBuy} onChange={e => setPriceBuy(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Sale Price ($)</label>
                                                <input type="number" step="0.01" placeholder="Discounted" value={priceBuySale} onChange={e => setPriceBuySale(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in duration-150">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Base 3-Day Rent ($)</label>
                                                    <input type="number" step="0.01" placeholder="Original" value={priceRent3Day} onChange={e => setPriceRent3Day(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Sale 3-Day Rent ($)</label>
                                                    <input type="number" step="0.01" placeholder="Discounted" value={priceRent3DaySale} onChange={e => setPriceRent3DaySale(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Add-on Price Per Extra Day ($)</label>
                                                <input type="number" step="0.01" placeholder="Rate per additional day" value={priceRentSubsequent} onChange={e => setPriceRentSubsequent(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required />
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Availability Toggle */}
                                    <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <input 
                                            type="checkbox" 
                                            id="is-available"
                                            checked={isAvailable}
                                            onChange={e => setIsAvailable(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                        />
                                        <label htmlFor="is-available" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                            Available for Renting / Purchase
                                        </label>
                                    </div>

                                    {/* Image Management */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Garment Photos</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {editingProduct?.images.map(img => (
                                                <div key={img.id} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={img.url} className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={async () => {
                                                            if (confirm("Delete this photo?")) {
                                                                const token = localStorage.getItem('token');
                                                                await fetch(`/api/catalog/products/${editingProduct.id}/images/${img.id}`, { 
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                fetchData();
                                                                setEditingProduct({...editingProduct, images: editingProduct.images.filter(i => i.id !== img.id)});
                                                            }
                                                        }}
                                                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {selectedFiles.map((file, i) => (
                                                <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-indigo-200 bg-indigo-50 flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-indigo-400">New</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                                                        className="absolute -top-1 -right-1 bg-white shadow-sm rounded-full p-1 text-slate-400 hover:text-red-600"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                multiple 
                                                accept="image/*"
                                                onChange={e => {
                                                    if (e.target.files) {
                                                        setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
                                                    }
                                                }}
                                                className="hidden" 
                                                id="file-upload" 
                                            />
                                            <label htmlFor="file-upload" className="flex items-center justify-center w-full p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{uploading ? 'Processing...' : 'Upload Photos'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Color & Size */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Color</label>
                                            <input placeholder="Ex: Emerald" value={color} onChange={e => setColor(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Size</label>
                                            <input placeholder="Ex: XL" value={size} onChange={e => setSize(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Description</label>
                                        <textarea placeholder="Garment details..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm min-h-[100px]" />
                                    </div>

                                    <div className="flex space-x-2 pt-4">
                                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 text-sm">
                                            {editingProduct ? 'Commit Changes' : 'Publish Item'}
                                        </button>
                                        {editingProduct && (
                                            <button type="button" onClick={resetProductForm} className="px-5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-100 text-sm transition-colors">Discard</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="lg:col-span-7">
                            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Inventory</h2>
                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black">{products.length} Items</span>
                                </div>
                                <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 no-scrollbar">
                                    {products.map(p => (
                                        <div key={p.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all duration-300 border border-slate-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                    <img src={p.images?.[0]?.url || "https://dummyimage.com/200x200/fff/ccc&text=P"} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm leading-none">{p.name}</p>
                                                    <div className="flex items-center space-x-2 mt-1.5">
                                                        <span className={`text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded ${
                                                            p.type === 'rent' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {p.type}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                            {p.type === 'rent' 
                                                                ? `$${p.price_rent_3day} / 3d`
                                                                : `$${p.price_buy}`
                                                            }
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {p.available ? 'available' : 'rented/offline'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1.5">
                                                <button onClick={() => startEditing(p)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-55 bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs uppercase">
                                                        {u.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-sm">{u.full_name || 'Anonymous User'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.email}</td>
                                            <td className="px-6 py-4 text-xs">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${u.is_admin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {u.is_admin ? 'Admin' : 'Customer'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-4">
                        {reviews.length > 0 ? reviews.map(r => (
                            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black">USER {r.user_id}</span>
                                            <span className="text-slate-300 text-xs">→</span>
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">PRODUCT {r.product_id}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                                            {format(new Date(r.created_at), 'MMMM d, yyyy • p')}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">
                                        <span className="text-yellow-600 font-black text-xs">{r.rating}</span>
                                        <span className="text-yellow-400 text-xs">★</span>
                                    </div>
                                </div>
                                
                                <p className="text-slate-700 font-medium italic text-sm">"{r.comment}"</p>
                                
                                {(r.original_comment !== r.comment || r.original_rating !== r.rating) && (
                                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 space-y-1 text-xs">
                                        <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Moderator Log</p>
                                        {r.original_comment !== r.comment && (
                                            <p className="text-indigo-600 italic">Original Comment: "{r.original_comment}"</p>
                                        )}
                                        {r.original_rating !== r.rating && (
                                            <p className="text-indigo-600 italic">Original Rating: {r.original_rating}★</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                                    <button onClick={() => handleUpdateReview(r)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors">Edit</button>
                                    <button onClick={() => handleRevertReview(r.id)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all">Revert</button>
                                    <button onClick={() => handleDeleteReview(r.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-all">Delete</button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting customer reviews...</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'blocks' && (
                    <div className="max-w-xl mx-auto">
                        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Rental Calendar Override</h2>
                                <p className="text-slate-400 text-xs mt-1">Manually block date ranges on the rental availability calendar.</p>
                            </div>
                            <form onSubmit={handleBlockDates} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Target Product</label>
                                    <select value={blockProductId} onChange={e => setBlockProductId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required>
                                        <option value="">Locate item...</option>
                                        {products.filter(p => p.type === 'rent').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (SKU-{p.id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Start Date</label>
                                        <input type="date" value={blockStart} onChange={e => setBlockStart(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">End Date</label>
                                        <input type="date" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" required />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98">
                                    Enforce Blackout Block
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Create New Category</h2>
                            <form onSubmit={handleAddCategory} className="flex space-x-2">
                                <input 
                                    placeholder="Ex: Traditional Wear" 
                                    value={newCategoryName} 
                                    onChange={e => setNewCategoryName(e.target.value)} 
                                    className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" 
                                    required 
                                />
                                <button type="submit" className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm">
                                    Create
                                </button>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Product Categories</h2>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {categories.map(cat => (
                                    <div key={cat.id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors border border-slate-100">
                                        <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'discounts' && (
                    <div className="max-w-xl mx-auto animate-in fade-in duration-200">
                        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Global Store Discount Engine</h2>
                                <p className="text-slate-400 text-xs mt-1">Set a catalog-wide percentage discount that overrides item-specific sale prices.</p>
                            </div>
                            <form onSubmit={handleSaveGlobalDiscount} className="space-y-6">
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <label htmlFor="discount-active" className="text-xs font-bold text-slate-700 block cursor-pointer">
                                            Enable Global Discount
                                        </label>
                                        <span className="text-[10px] text-slate-400 font-semibold">Toggles discount active status across the store</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        id="discount-active"
                                        checked={globalDiscountActive}
                                        onChange={e => setGlobalDiscountActive(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Discount Rate (%)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="0" max="100" step="0.5"
                                            value={globalDiscountPercentage} 
                                            onChange={e => setGlobalDiscountPercentage(Number(e.target.value))} 
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-sm" 
                                            required 
                                        />
                                        <span className="absolute right-4 top-3 text-slate-400 font-bold text-sm">%</span>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98">
                                    Apply Global Discount Settings
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
