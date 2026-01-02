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
    price_1_day: number;
    price_subsequent_day: number;
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
    const [activeTab, setActiveTab] = useState<'products' | 'users' | 'reviews' | 'blocks' | 'categories'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);


    // Form States
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Party Wear");
    const [price1, setPrice1] = useState(0);
    const [priceSub, setPriceSub] = useState(0);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    // Category Form State
    const [newCategoryName, setNewCategoryName] = useState("");

    // Date Block State
    const [blockProductId, setBlockProductId] = useState("");
    const [blockStart, setBlockStart] = useState("");
    const [blockEnd, setBlockEnd] = useState("");


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
            const [pRes, uRes, rRes, cRes] = await Promise.all([
                fetch('/api/catalog/products'),
                fetch('/api/auth/users'),
                fetch('/api/feedback/reviews'),
                fetch('/api/catalog/categories')
            ]);
            if (pRes.ok) setProducts(await pRes.json());
            if (uRes.ok) setUsers(await uRes.json());
            if (rRes.ok) setReviews(await rRes.json());
            if (cRes.ok) setCategories(await cRes.json());
        } catch (error) {
            console.error("Error fetching admin data", error);
        }
    };


    const resetProductForm = () => {
        setEditingProduct(null);
        setName("");
        setDescription("");
        setCategory("Party Wear");
        setPrice1(0);
        setSelectedFiles([]);
        setPrice1(0);
        setPriceSub(0);
        setColor("");
        setSize("");
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, description, category, price_1_day: price1, price_subsequent_day: priceSub, color, size };
        
        const url = editingProduct ? `/api/catalog/products/${editingProduct.id}` : '/api/catalog/products';
        const method = editingProduct ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
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
                            body: formData
                        });
                    }
                    setUploading(false);
                }

                alert(editingProduct ? "Product Updated!" : "Product Added!");
                resetProductForm();
                fetchData();
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
        setPrice1(p.price_1_day);
        setPriceSub(p.price_subsequent_day);
        setColor(p.color);
        setSize(p.size);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        const res = await fetch(`/api/catalog/products/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    };

    const handleBlockDates = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/rental/blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        }
    };

    const handleRevertReview = async (id: number) => {
        const res = await fetch(`/api/feedback/reviews/${id}/revert`, { method: 'POST' });
        if (res.ok) fetchData();
    };

    const handleDeleteReview = async (id: number) => {
        if (!confirm("Delete this review?")) return;
        const res = await fetch(`/api/feedback/reviews/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    };

    const handleUpdateReview = async (r: Review) => {
        const newComment = prompt("Edit review comment:", r.comment);
        if (newComment === null) return;
        
        const newRatingStr = prompt("Edit rating (1-5):", r.rating.toString());
        if (newRatingStr === null) return;
        const newRating = parseInt(newRatingStr);

        const res = await fetch(`/api/feedback/reviews/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: newComment, rating: newRating })
        });
        if (res.ok) fetchData();
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/catalog/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch(`/api/catalog/categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchData();
        } else {
            const err = await res.json();
            alert(err.detail || "Failed to delete category");
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
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-wrap sm:flex-nowrap">
                    {(['products', 'users', 'reviews', 'blocks', 'categories'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-black capitalize transition-all duration-300 ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>


                {activeTab === 'products' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-5">
                            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
                                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{editingProduct ? 'Update Garment' : 'New Collection Item'}</h2>
                                <form onSubmit={handleSaveProduct} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
                                        <input placeholder="Ex: Vintage Silk Saree" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 appearance-none">
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Day 1 Price</label>
                                            <input type="number" placeholder="Rs" value={price1} onChange={e => setPrice1(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subsequent Price</label>
                                            <input type="number" placeholder="Rs" value={priceSub} onChange={e => setPriceSub(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" required />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Garment Photos {editingProduct && `(Existing: ${editingProduct.images.length})`}</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {editingProduct?.images.map(img => (
                                                <div key={img.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                                                    <img src={img.url} className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={async () => {
                                                            if (confirm("Delete this photo?")) {
                                                                await fetch(`/api/catalog/products/${editingProduct.id}/images/${img.id}`, { method: 'DELETE' });
                                                                fetchData();
                                                                // Also update editingProduct state to reflect deletion
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
                                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-indigo-200 bg-indigo-50 flex items-center justify-center">
                                                    <span className="text-[10px] font-black text-indigo-400">New</span>
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
                                            <label htmlFor="file-upload" className="flex items-center justify-center w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{uploading ? 'Processing...' : 'Choose Photos'}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Color</label>
                                            <input placeholder="Ruby Red" value={color} onChange={e => setColor(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Size</label>
                                            <input placeholder="Medium / Regular" value={size} onChange={e => setSize(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                                        <textarea placeholder="..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 min-h-[120px]" />
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                                            {editingProduct ? 'Commit Changes' : 'Publish Item'}
                                        </button>
                                        {editingProduct && (
                                            <button type="button" onClick={resetProductForm} className="px-6 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors">Discard</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="lg:col-span-7">
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Inventory</h2>
                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black">{products.length} Items</span>
                                </div>
                                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 no-scrollbar">
                                    {products.map(p => (
                                        <div key={p.id} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 border border-transparent hover:border-slate-100">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                                                    <img src={p.images?.[0]?.url || "https://dummyimage.com/200x200/fff/ccc&text=P"} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-tight">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">{p.category} • Rs. {p.price_1_day}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => startEditing(p)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>
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
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Profile</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Address</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs uppercase tracking-tighter">
                                                        {u.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-black text-slate-900 tracking-tight">{u.full_name || 'Anonymous User'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-500">{u.email}</td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.is_admin ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                                    {u.is_admin ? 'Admin' : 'Regular'}
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
                    <div className="space-y-6">
                        {reviews.length > 0 ? reviews.map(r => (
                            <div key={r.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-500">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">USER {r.user_id}</span>
                                                <span className="text-slate-300">→</span>
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">PRODUCT {r.product_id}</span>
                                            </div>
                                            <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                                                <span className="text-yellow-600 font-black text-sm">{r.rating}</span>
                                                <span className="text-yellow-400 text-sm">★</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-700 font-bold italic text-lg leading-relaxed">"{r.comment}"</p>
                                        {(r.original_comment !== r.comment || r.original_rating !== r.rating) && (
                                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-1">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Editor Notes</p>
                                                {r.original_comment !== r.comment && (
                                                    <p className="text-xs text-indigo-600 font-bold italic leading-none">Original: "{r.original_comment}"</p>
                                                )}
                                                {r.original_rating !== r.rating && (
                                                    <p className="text-xs text-indigo-600 font-bold italic leading-none">Original Rating: {r.original_rating}★</p>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{format(new Date(r.created_at), 'MMMM d, yyyy • p')}</p>
                                    </div>
                                    <div className="flex md:flex-col gap-2 w-full md:w-auto">
                                        <button onClick={() => handleUpdateReview(r)} className="flex-1 px-6 py-3 bg-slate-50 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Adjust</button>
                                        <button onClick={() => handleRevertReview(r.id)} className="flex-1 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Revert</button>
                                        <button onClick={() => handleDeleteReview(r.id)} className="flex-1 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Discard</button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-32 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Awaiting client feedback</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'blocks' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-indigo-100 border border-slate-100">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Operational Override</h2>
                                <p className="text-slate-500 font-bold text-sm tracking-tight leading-none">Lock inventory dates for maintenance or offline bookings.</p>
                            </div>
                            <form onSubmit={handleBlockDates} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Product</label>
                                    <select value={blockProductId} onChange={e => setBlockProductId(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 appearance-none text-lg" required>
                                        <option value="">Locate entry...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU-{p.id})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Blackout Start</label>
                                        <input type="date" value={blockStart} onChange={e => setBlockStart(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-50 outline-none font-black text-indigo-600" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Blackout End</label>
                                        <input type="date" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-50 outline-none font-black text-indigo-600" required />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-xl shadow-xl shadow-red-100 hover:bg-red-700 hover:-translate-y-1 transition-all active:scale-95 duration-300">
                                    Enforce Blackout
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 mb-8">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Add New Category</h2>
                            <form onSubmit={handleAddCategory} className="flex space-x-3">
                                <input 
                                    placeholder="Ex: Summer Collection" 
                                    value={newCategoryName} 
                                    onChange={e => setNewCategoryName(e.target.value)} 
                                    className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900" 
                                    required 
                                />
                                <button type="submit" className="px-8 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                                    Add
                                </button>
                            </form>
                        </div>

                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Active Categories</h2>
                            <div className="space-y-3">
                                {categories.map(cat => (
                                    <div key={cat.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                        <span className="font-bold text-slate-900">{cat.name}</span>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
