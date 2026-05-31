"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import RentalCalendar from '@/components/RentalCalendar';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useCart } from '@/components/CartContext';

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

interface Review {
    id: number;
    user_id: number;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ProductDetails() {
    const adminPhoneNumber = process.env.NEXT_PUBLIC_ADMIN_PHONE || "916206430920";
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
    const [globalDiscount, setGlobalDiscount] = useState({ percentage: 0, is_active: false });

    const { addToCart } = useCart();
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        
        let currentUserId: number | null = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserId = payload.user_id;
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

                // Fetch Global Discount
                const dRes = await fetch('/api/catalog/global-discount');
                if (dRes.ok) {
                    setGlobalDiscount(await dRes.json());
                }

            } catch (error) {
                console.error("Failed to fetch product details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAddToCartRent = (range: DateRange) => {
        if (!range.from || !range.to || !product) return;

        // Calculate rent days
        const days = differenceInDays(range.to, range.from) + 1;
        
        // Calculate active base price (with discounts)
        let originalBase = product.price_rent_3day || 0;
        let activeBase = originalBase;
        
        if (globalDiscount.is_active && globalDiscount.percentage > 0) {
            activeBase = originalBase * (1 - globalDiscount.percentage / 100);
        } else if (product.price_rent_3day_sale) {
            activeBase = product.price_rent_3day_sale;
        }

        const addOnDays = Math.max(0, days - 3);
        const totalPrice = activeBase + (addOnDays * (product.price_rent_subsequent || 0));

        const result = addToCart({
            productId: product.id,
            name: product.name,
            image: product.images?.[0]?.url || "",
            category: product.category,
            type: 'rent',
            originalPrice: originalBase,
            price: totalPrice,
            rentStartDate: format(range.from, 'yyyy-MM-dd'),
            rentEndDate: format(range.to, 'yyyy-MM-dd'),
            rentDays: days,
            priceRentSubsequent: product.price_rent_subsequent || 0
        });

        if (result.success) {
            alert("Added to cart! Open your cart in the top menu to complete checkout.");
        } else if (result.message) {
            alert(result.message);
        }
    };

    const handleAddToCartBuy = () => {
        if (!product) return;

        let originalPrice = product.price_buy || 0;
        let activePrice = originalPrice;

        if (globalDiscount.is_active && globalDiscount.percentage > 0) {
            activePrice = originalPrice * (1 - globalDiscount.percentage / 100);
        } else if (product.price_buy_sale) {
            activePrice = product.price_buy_sale;
        }

        const result = addToCart({
            productId: product.id,
            name: product.name,
            image: product.images?.[0]?.url || "",
            category: product.category,
            type: 'buy',
            originalPrice: originalPrice,
            price: activePrice
        });

        if (result.success) {
            alert("Added to cart! Open your cart in the top menu to complete checkout.");
        } else if (result.message) {
            alert(result.message);
        }
    };

    const handleWhatsAppRent = (range: DateRange, totalPrice: number) => {
        if (!range.from || !range.to || !product) return;
        const start = format(range.from, 'PPP');
        const end = format(range.to, 'PPP');
        const message = `Hello! I'm interested in renting "${product.name}" from ${start} to ${end}. Estimate price: $${totalPrice.toFixed(2)}. Is it available?`;
        window.open(`https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleWhatsAppBuy = () => {
        if (!product) return;
        let originalPrice = product.price_buy || 0;
        let activePrice = originalPrice;
        if (globalDiscount.is_active && globalDiscount.percentage > 0) {
            activePrice = originalPrice * (1 - globalDiscount.percentage / 100);
        } else if (product.price_buy_sale) {
            activePrice = product.price_buy_sale;
        }
        
        const message = `Hello! I'm interested in buying "${product.name}" for $${activePrice.toFixed(2)}. Is it available?`;
        window.open(`https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !product) return;

        setSubmittingReview(true);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = parseInt(payload.user_id || "0");
            
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
                setHasReviewed(true);
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

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-150 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-xl font-bold text-slate-800 mb-2">Garment Not Found</h1>
            <Link href="/catalog" className="text-indigo-600 font-bold hover:underline text-sm">Back to Catalog</Link>
        </div>
    );

    // Calculate active price variables for detail page display
    let originalBase = 0;
    let saleBase: number | null = null;

    if (product.type === 'buy') {
        originalBase = product.price_buy || 0;
        if (globalDiscount.is_active && globalDiscount.percentage > 0) {
            saleBase = originalBase * (1 - globalDiscount.percentage / 100);
        } else if (product.price_buy_sale) {
            saleBase = product.price_buy_sale;
        }
    } else {
        originalBase = product.price_rent_3day || 0;
        if (globalDiscount.is_active && globalDiscount.percentage > 0) {
            saleBase = originalBase * (1 - globalDiscount.percentage / 100);
        } else if (product.price_rent_3day_sale) {
            saleBase = product.price_rent_3day_sale;
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
                    
                    {/* Image Section */}
                    <div className="lg:col-span-7 mb-8 lg:mb-0">
                        <div className="sticky top-24 space-y-4">
                            <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-lg group">
                                <img
                                    src={product.images?.[activeImageIndex]?.url || "https://dummyimage.com/1200x1600/f8fafc/64748b&text=Designer+Wear"}
                                    alt={product.name}
                                    className="w-full h-full object-center object-cover aspect-[3/4] transition-all duration-500"
                                />
                                {!product.available && (
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                                        <span className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider shadow-xl">
                                            Currently Rented Out
                                        </span>
                                    </div>
                                )}
                                
                                {product.images.length > 1 && (
                                    <>
                                        <button 
                                            onClick={() => setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2.5 rounded-full shadow-md hover:bg-white"
                                        >
                                            <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg>
                                        </button>
                                        <button 
                                            onClick={() => setActiveImageIndex((prev) => (prev + 1) % product.images.length)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2.5 rounded-full shadow-md hover:bg-white"
                                        >
                                            <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7"/></svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.images.length > 1 && (
                                <div className="flex space-x-2.5 overflow-x-auto pb-1 no-scrollbar">
                                    {product.images.map((img, idx) => (
                                        <button 
                                            key={img.id} 
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-indigo-600' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img.url} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Color</p>
                                    <p className="text-xs font-black text-slate-800">{product.color || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Size</p>
                                    <p className="text-xs font-black text-slate-800">{product.size || 'Universal'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Condition</p>
                                    <p className="text-xs font-black text-slate-800">Pristine</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details and Actions Section */}
                    <div className="lg:col-span-5">
                        <div className="space-y-6">
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-50 border ${
                                    product.type === 'rent' ? 'text-indigo-600 border-indigo-100' : 'text-emerald-600 border-emerald-100'
                                }`}>
                                    To {product.type === 'rent' ? 'Rent' : 'Buy'}
                                </span>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mt-2">{product.name}</h1>
                                <p className="text-indigo-600 font-bold text-sm">{product.category}</p>
                            </div>

                            {/* Pricing Card */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex justify-between items-baseline">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                            {product.type === 'rent' ? 'Base 3-Day Rent' : 'Retail Price'}
                                        </p>
                                        <div className="flex items-baseline space-x-2">
                                            {saleBase !== null ? (
                                                <>
                                                    <span className="text-3xl font-black text-slate-800">${saleBase.toFixed(2)}</span>
                                                    <span className="text-sm text-slate-400 line-through">${originalBase.toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span className="text-3xl font-black text-slate-800">${originalBase.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>
                                    {product.type === 'rent' && (
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Extra Day</p>
                                            <span className="text-lg font-black text-indigo-600">${product.price_rent_subsequent || 0}/day</span>
                                        </div>
                                    )}
                                </div>

                                {product.type === 'rent' ? (
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                                            Select dates on the calendar to reserve this garment. Rentals include custom tailoring based on your measurements.
                                        </p>
                                        <RentalCalendar 
                                            bookedDates={bookedDates}
                                            price3Day={saleBase !== null ? saleBase : originalBase}
                                            priceSubsequentDay={product.price_rent_subsequent || 0}
                                            onAddToCart={handleAddToCartRent}
                                            onWhatsApp={handleWhatsAppRent}
                                            isLoggedIn={isLoggedIn}
                                        />
                                        {availabilityError && (
                                            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                                <p className="text-amber-700 text-[10px] font-bold leading-normal">
                                                    ⚠️ Calendar sync is currently offline. You can still add items or enquire via WhatsApp.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        {isLoggedIn ? (
                                            <button
                                                onClick={handleAddToCartBuy}
                                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-50 transition-all hover:-translate-y-0.5"
                                            >
                                                Add to Cart
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-lg transition-all"
                                            >
                                                Sign In to Buy
                                            </button>
                                        )}
                                        <button
                                            onClick={handleWhatsAppBuy}
                                            className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-green-500 rounded-xl font-bold text-sm text-green-600 hover:bg-green-50 transition-all"
                                        >
                                            <span>Enquire via WhatsApp</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 leading-none">Description</h3>
                                <p className="text-slate-600 font-medium leading-relaxed text-sm">
                                    {product.description || "Every piece in our collection is handpicked for its quality and style. This garment offers a perfect blend of comfort and high-fashion aesthetics, making it ideal for your special occasion."}
                                </p>
                            </div>

                            {/* Reviews Section */}
                            <div className="pt-10 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Reviews & Ratings</h3>
                                    <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                                        <span className="text-yellow-600 font-black mr-1 text-xs">4.8</span>
                                        <span className="text-yellow-400 text-xs pb-0.5">★</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {reviews.length > 0 ? (
                                        reviews.map(r => (
                                            <div key={r.id} className="p-4 rounded-xl bg-white border border-slate-100 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center space-x-1.5">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] font-black">
                                                            U
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">Client {r.user_id}</span>
                                                    </div>
                                                    <span className="text-yellow-400 text-xs">{"★".repeat(r.rating)}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed italic">"{r.comment}"</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 bg-white rounded-xl border border-slate-100">
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No reviews yet.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 p-6 bg-indigo-600 rounded-2xl text-center shadow-xl shadow-indigo-100">
                                    <h4 className="text-sm font-black text-white mb-1 leading-none">Submit Review</h4>
                                    <p className="text-indigo-100 text-xs font-medium opacity-80 mb-6 leading-none">Rate this style to build buyer trust.</p>
                                    
                                    {isLoggedIn ? (
                                        hasReviewed ? (
                                            <div className="bg-indigo-500/30 p-4 rounded-xl border border-indigo-400 text-xs text-white font-bold">
                                                You have already reviewed this product.
                                            </div>
                                        ) : showReviewForm ? (
                                            <form onSubmit={handleReviewSubmit} className="max-w-md mx-auto space-y-3">
                                                <div className="flex justify-center space-x-1.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setReviewRating(star)}
                                                            className={`text-xl ${reviewRating >= star ? 'text-yellow-400' : 'text-indigo-300'}`}
                                                        >
                                                            ★
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                    placeholder="Review details..."
                                                    rows={3}
                                                    className="w-full p-3 rounded-xl bg-indigo-500 border border-indigo-400 text-white placeholder-indigo-200 focus:outline-none focus:ring-1 focus:ring-white/50 text-xs"
                                                    required
                                                />
                                                <div className="flex space-x-2">
                                                    <button 
                                                        type="submit" 
                                                        disabled={submittingReview}
                                                        className="flex-1 bg-white text-indigo-600 py-2.5 rounded-full font-black text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                    >
                                                        {submittingReview ? 'Sending...' : 'Post Review'}
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowReviewForm(false)}
                                                        className="px-4 py-2.5 rounded-full font-bold text-xs text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button 
                                                onClick={() => setShowReviewForm(true)}
                                                className="bg-white text-indigo-600 px-6 py-2.5 rounded-full font-black text-xs hover:shadow-lg transition-all"
                                            >
                                                Write a Review
                                            </button>
                                        )
                                    ) : (
                                        <button 
                                            onClick={() => window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-full font-black text-xs hover:shadow-lg transition-all inline-block"
                                        >
                                            Log in to Review
                                        </button>
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
