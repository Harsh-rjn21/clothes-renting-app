"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import RentalCalendar from '@/components/RentalCalendar';
import { useParams } from 'next/navigation';
import { addDays } from 'date-fns';

interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    image_url?: string;
    price_1_day: number;
    price_3_days: number;
    price_7_days: number;
    available: boolean;
    color: string;
    size: string;
}

interface RentalAvailability {
    product_id: number;
    booked_dates: string[];
}

interface Review {
    id: number;
    user_id: number;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ProductDetails() {
    const params = useParams();
    const id = params.id;
    const [product, setProduct] = useState<Product | null>(null);
    const [bookedDates, setBookedDates] = useState<Date[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Review Form State
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch Product
                const prodRes = await fetch(`/api/catalog/products/${id}`);
                if (prodRes.ok) {
                    setProduct(await prodRes.json());
                }

                // Fetch Availability
                const availRes = await fetch(`/api/rental/availability/${id}`);
                if (availRes.ok) {
                    const data: RentalAvailability = await availRes.json();
                    setBookedDates(data.booked_dates.map(d => new Date(d)));
                }

                // Fetch Reviews
                const reviewRes = await fetch(`/api/feedback/reviews/${id}`);
                if (reviewRes.ok) {
                    setReviews(await reviewRes.json());
                }

            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleBook = async (startDate: Date, duration: number) => {
        if (!product) return;
        
        try {
            const endDate = addDays(startDate, duration);
            const bookingData = {
                product_id: product.id,
                user_id: 1, // Dummy user ID
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            };

            const response = await fetch('/api/rental/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                alert('Booking Confirmed!');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Booking Failed: ${error.detail}`);
            }
        } catch (error) {
            console.error("Booking error", error);
            alert("An error occurred while booking.");
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const reviewData = {
                product_id: parseInt(id as string),
                user_id: 1, // Dummy user
                rating: newRating,
                comment: newComment
            };
            const response = await fetch('/api/feedback/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            if (response.ok) {
                const newReview = await response.json();
                setReviews([...reviews, newReview]);
                setNewComment("");
                alert("Review submitted!");
            } else {
                alert("Failed to add review");
            }
        } catch (error) {
            console.error("Error submitting review", error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!product) return <div>Product not found</div>;

    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
                    {/* Image Gallery */}
                    <div className="flex-col-reverse">
                        <div className="w-full aspect-w-1 aspect-h-1">
                            <img
                                src={product.image_url || "https://dummyimage.com/600x400/000/fff&text=No+Image"}
                                alt={product.name}
                                className="w-full h-full object-center object-cover sm:rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
                        <div className="mt-3">
                            <h2 className="sr-only">Product information</h2>
                            <p className="text-3xl text-gray-900">${product.price_3_days}<span className="text-sm text-gray-500"> / 3 days</span></p>
                            
                            {/* Rating Summary */}
                            <div className="mt-2 flex items-center">
                                <div className="flex items-center">
                                    {[0, 1, 2, 3, 4].map((rating) => (
                                        <svg
                                            key={rating}
                                            className={`h-5 w-5 flex-shrink-0 ${
                                                (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)) > rating ? 'text-yellow-400' : 'text-gray-200'
                                            }`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="ml-3 text-sm text-gray-500">{reviews.length} reviews</p>
                             </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="sr-only">Description</h3>
                            <div className="text-base text-gray-700 space-y-6" dangerouslySetInnerHTML={{ __html: product.description || "" }} />
                        </div>
                        
                        <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                             <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Color</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.color || "N/A"}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Size</dt>
                                <dd className="mt-1 text-sm text-gray-900">{product.size || "N/A"}</dd>
                            </div>
                        </dl>

                        <div className="mt-10 border-t border-gray-200 pt-10">
                             <RentalCalendar 
                                bookedDates={bookedDates}
                                price1Day={product.price_1_day}
                                price3Days={product.price_3_days}
                                price7Days={product.price_7_days}
                                onBook={handleBook}
                             />
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-16 border-t border-gray-200 pt-10">
                    <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">Reviews</h3>
                    
                    {/* Review List */}
                    <div className="mt-8 space-y-8">
                        {reviews.map((review) => (
                            <div key={review.id} className="flex space-x-4">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                         <div className="flex items-center">
                                            {[0, 1, 2, 3, 4].map((rating) => (
                                                <svg
                                                    key={rating}
                                                    className={`h-5 w-5 flex-shrink-0 ${
                                                        review.rating > rating ? 'text-yellow-400' : 'text-gray-200'
                                                    }`}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="ml-2 text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="mt-2 text-base text-gray-700">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                        {reviews.length === 0 && <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>}
                    </div>

                    {/* Add Review Form */}
                    <div className="mt-10 bg-gray-50 p-6 rounded-lg max-w-2xl">
                        <h4 className="text-lg font-bold text-gray-900">Write a Review</h4>
                        <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rating</label>
                                <select
                                    value={newRating}
                                    onChange={(e) => setNewRating(parseInt(e.target.value))}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Comment</label>
                                <textarea
                                    rows={4}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="How was the item?"
                                    required
                                />
                            </div>
                            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Submit Review
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
