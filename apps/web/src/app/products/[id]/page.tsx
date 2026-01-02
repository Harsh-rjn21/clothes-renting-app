"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import RentalCalendar from '@/components/RentalCalendar';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
    available: boolean;
    color: string;
    size: string;
}

interface Review {
    id: number;
    user_id: number;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ProductDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [bookedDates, setBookedDates] = useState<Date[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);


    
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        
        let currentUserId: number | null = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserId = payload.sub || payload.user_id;
            } catch (e) {}
        }

        const fetchDetails = async () => {
            try {
                // Fetch Product
                const pRes = await fetch(`/api/catalog/products/${id}`);
                if (pRes.ok) setProduct(await pRes.json());

                // Fetch Reviews & check if user already reviewed
                const rRes = await fetch(`/api/feedback/reviews/${id}`);
                if (rRes.ok) {
                    const rData: Review[] = await rRes.json();
                    setReviews(rData);
                    if (currentUserId) {
                        setHasReviewed(rData.some(r => r.user_id === currentUserId));
                    }
                }

                // Fetch Availability
                try {
                    const aRes = await fetch(`/api/rental/availability/${id}`);
                    if (aRes.ok) {
                        const availability = await aRes.json();
                        setBookedDates(availability.booked_dates.map((d: string) => new Date(d)));
                        setAvailabilityError(false);
                    } else {
                        setAvailabilityError(true);
                    }
                } catch (e) {
                    console.error("Availability service unreachable", e);
                    setAvailabilityError(true);
                }

            } catch (error) {
                console.error("Failed to fetch product details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);


    const handleBook = async (range: DateRange) => {
        if (!range.from || !range.to || !product) return;
        
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = parseInt(payload.user_id || payload.sub || "0");
        
        if (isNaN(userId) || userId === 0) {
            alert("Session expired or invalid. Please log in again.");
            return router.push('/login');
        }

        try {
            const res = await fetch('/api/rental/bookings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: product.id,
                    user_id: userId,
                    start_date: format(range.from, 'yyyy-MM-dd'),
                    end_date: format(range.to, 'yyyy-MM-dd')
                })
            });

            if (res.ok) {
                alert("Booking Requested Successfully!");
                router.push('/catalog');
            } else {
                const err = await res.json();
                alert(err.detail || "Booking failed");
            }
        } catch (e) {
            alert("Connection error");
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !product) return;

        setSubmittingReview(true);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = parseInt(payload.user_id || payload.sub || "0");
            
            if (isNaN(userId) || userId === 0) {
                alert("Session expired. Please log in again.");
                return router.push('/login');
            }

            const res = await fetch('/api/feedback/reviews', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: product.id,
                    user_id: userId,
                    rating: reviewRating,
                    comment: reviewComment
                })
            });

            if (res.ok) {
                alert("Review submitted!");
                setReviewComment("");
                setShowReviewForm(false);
                setHasReviewed(true); // Update local state immediately
                // Refresh reviews
                const rRes = await fetch(`/api/feedback/reviews/${id}`);
                if (rRes.ok) setReviews(await rRes.json());
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to submit review");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleWhatsApp = (range: DateRange, totalPrice: number) => {
        if (!range.from || !range.to || !product) return;
        const start = format(range.from, 'PPP');
        const end = format(range.to, 'PPP');
        const message = `Hello! I'm interested in renting the "${product.name}" from ${start} to ${end}. Total estimated price: Rs. ${totalPrice}. Is it available?`;
        window.open(`https://wa.me/916206430920?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-black text-slate-900 mb-4">Product Not Found</h1>
            <Link href="/catalog" className="text-indigo-600 font-bold hover:underline">Back to Catalog</Link>
        </div>
    );

    return (
        <div className="bg-white min-h-screen pb-20">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
                    
                    {/* Image Section */}
                    <div className="lg:col-span-7 mb-12 lg:mb-0">
                        <div className="sticky top-28 space-y-4">
                            <div className="relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xl shadow-slate-100 group">
                                <img
                                    src={product.images?.[activeImageIndex]?.url || "https://dummyimage.com/1200x1600/f8fafc/64748b&text=Designer+Wear"}
                                    alt={product.name}
                                    className="w-full h-full object-center object-cover aspect-[3/4] transition-all duration-700 hover:scale-105"
                                />
                                {!product.available && (
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                                        <span className="bg-white text-slate-900 px-8 py-4 rounded-full font-black text-xl uppercase tracking-tighter shadow-2xl">Currently Rented</span>
                                    </div>
                                )}
                                
                                {product.images.length > 1 && (
                                    <>
                                        <button 
                                            onClick={() => setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg>
                                        </button>
                                        <button 
                                            onClick={() => setActiveImageIndex((prev) => (prev + 1) % product.images.length)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7"/></svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.images.length > 1 && (
                                <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                                    {product.images.map((img, idx) => (
                                        <button 
                                            key={img.id} 
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-indigo-600' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img.url} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">Color</p>
                                    <p className="text-sm font-bold text-slate-900 leading-none">{product.color || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">Size</p>
                                    <p className="text-sm font-bold text-slate-900 leading-none">{product.size || 'Universal'}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">Condition</p>
                                    <p className="text-sm font-bold text-slate-900 leading-none">Pristine</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details and Rental Section */}
                    <div className="lg:col-span-5">
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-2">{product.name}</h1>
                                <p className="text-indigo-600 font-bold text-lg">{product.category}</p>
                            </div>

                            <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 shadow-sm">
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {product.price_1_day}</span>
                                    <span className="text-slate-500 font-bold text-sm tracking-tight uppercase tracking-widest">/ first day</span>
                                </div>
                                <p className="text-indigo-600 font-bold text-sm mt-2">+ Rs. {product.price_subsequent_day} for each extra day</p>
                                
                                <div className="mt-8 pt-8 border-t border-indigo-100">
                                    <RentalCalendar 
                                        bookedDates={bookedDates}
                                        price1Day={product.price_1_day}
                                        priceSubsequentDay={product.price_subsequent_day}
                                        onBook={handleBook}
                                        onWhatsApp={handleWhatsApp}
                                        isLoggedIn={isLoggedIn}
                                    />
                                    {availabilityError && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <p className="text-amber-700 text-xs font-bold leading-tight flex items-center">
                                                <span className="mr-2">⚠️</span>
                                                Real-time availability check is currently offline. You can still request a booking or enquire via WhatsApp.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2 leading-none">The Story</h3>
                                <p className="text-slate-600 font-medium leading-[1.7] text-lg">
                                    {product.description || "Every piece in our collection is handpicked for its quality and style. This garment offers a perfect blend of comfort and high-fashion aesthetics, making it ideal for your special occasion."}
                                </p>
                            </div>

                            {/* Reviews Section */}
                            <div className="mt-20 pt-20 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Community Reviews</h3>
                                    <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
                                        <span className="text-yellow-600 font-black mr-1 leading-none">4.8</span>
                                        <span className="text-yellow-400 leading-none pb-0.5">★</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    {reviews.length > 0 ? (
                                        reviews.map(r => (
                                            <div key={r.id} className="pb-8 border-b border-slate-50 last:border-0 group transition-all duration-300">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">U{r.user_id}</div>
                                                        <span className="text-sm font-bold text-slate-900">Verified Client</span>
                                                    </div>
                                                    <span className="text-yellow-400 font-bold">{"★".repeat(r.rating)}</span>
                                                </div>
                                                <p className="text-slate-600 font-medium italic group-hover:text-slate-900 transition-colors leading-relaxed">"{r.comment}"</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">
                                                    {format(new Date(r.created_at), 'MMMM d, yyyy')}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No reviews yet. Be the first!</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-12 p-10 bg-indigo-600 rounded-[32px] text-center shadow-2xl shadow-indigo-200">
                                    <h4 className="text-lg font-black text-white mb-2 leading-none">How was your fit?</h4>
                                    <p className="text-indigo-100 text-sm font-medium opacity-80 mb-8 leading-none">Share your StyleRent experience with the community.</p>
                                    
                                    {isLoggedIn ? (
                                        hasReviewed ? (
                                            <div className="bg-indigo-500/30 p-8 rounded-2xl border border-indigo-400">
                                                <p className="text-white font-bold">You have already shared your experience with this item. Thank you!</p>
                                            </div>
                                        ) : showReviewForm ? (
                                            <form onSubmit={handleReviewSubmit} className="max-w-md mx-auto space-y-4">
                                                <div className="flex justify-center space-x-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setReviewRating(star)}
                                                            className={`text-2xl ${reviewRating >= star ? 'text-yellow-400' : 'text-indigo-300'}`}
                                                        >
                                                            ★
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                    placeholder="Your thoughts..."
                                                    className="w-full p-4 rounded-2xl bg-indigo-500 border border-indigo-400 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium"
                                                    required
                                                />
                                                <div className="flex space-x-2">
                                                    <button 
                                                        type="submit" 
                                                        disabled={submittingReview}
                                                        className="flex-1 bg-white text-indigo-600 px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-transform disabled:opacity-50"
                                                    >
                                                        {submittingReview ? 'Sending...' : 'Post Review'}
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowReviewForm(false)}
                                                        className="px-6 py-3 rounded-full font-bold text-sm text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button 
                                                onClick={() => setShowReviewForm(true)}
                                                className="bg-white text-indigo-600 px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-transform"
                                            >
                                                Write a Review
                                            </button>
                                        )
                                    ) : (
                                        <Link href="/login" className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-black text-sm hover:scale-105 transition-transform shadow-lg leading-none">Log in to Review</Link>
                                    )}

                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
