"use client";

import React, { useState, useEffect } from 'react';
import { useCart, CartItem } from './CartContext';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    globalDiscountPercentage?: number;
    globalDiscountActive?: boolean;
}

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
    isOpen, 
    onClose,
    globalDiscountPercentage = 0,
    globalDiscountActive = false
}) => {
    const { cartItems, cartType, getCartTotal, clearCart } = useCart();
    
    // Steps: 'measurements' | 'payment' | 'success'
    const [step, setStep] = useState<'measurements' | 'payment' | 'success'>('measurements');
    const [loading, setLoading] = useState(false);
    
    // Measurement inputs per cart item ID
    // Key: cartItemId, Value: measurement object
    const [measurements, setMeasurements] = useState<Record<string, {
        armhole: string;
        chest: string;
        waist: string;
        sleeves: string;
        length: string;
    }>>({});

    // Initialize measurements form for each cart item
    useEffect(() => {
        if (isOpen && cartType === 'rent') {
            const initial: typeof measurements = {};
            cartItems.forEach(item => {
                initial[item.id] = {
                    armhole: '9',
                    chest: '36',
                    waist: '30',
                    sleeves: '22',
                    length: '40'
                };
            });
            setMeasurements(initial);
            setStep('measurements');
        } else if (isOpen && cartType === 'buy') {
            // Bypass measurements for buying
            setStep('payment');
        }
    }, [isOpen, cartItems, cartType]);

    if (!isOpen || (cartItems.length === 0 && step !== 'success')) return null;

    const handleMeasurementChange = (itemId: string, field: string, value: string) => {
        setMeasurements(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const handleProceedToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('payment');
    };

    const handlePay = async () => {
        setLoading(true);
        try {
            // Load Razorpay Script
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                alert("Failed to load Razorpay SDK. Please check your internet connection.");
                setLoading(false);
                return;
            }

            // Get user_id and email/name from token
            const token = localStorage.getItem('token');
            let userId = 1;
            let userEmail = "customer@example.com";
            let userName = "Valued Customer";
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userId = payload.user_id || 1;
                    userEmail = payload.sub || "customer@example.com";
                } catch {}
            }

            // 1. Create Order on Backend
            const orderRes = await fetch('/api/rental/bookings/razorpay-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: totalAmount })
            });

            if (!orderRes.ok) {
                const err = await orderRes.json();
                throw new Error(err.detail || "Failed to initiate transaction");
            }

            const razorpayOrder = await orderRes.json();

            // 2. Configure Razorpay options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "StyleRent",
                description: `Checkout for ${cartItems.length} items`,
                order_id: razorpayOrder.id,
                handler: async function (response: any) {
                    setLoading(true);
                    try {
                        // 3. Call verification endpoint
                        const verificationData = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: userId,
                            items: cartItems.map(item => {
                                const fit = measurements[item.id] || {};
                                return {
                                    product_id: item.productId,
                                    start_date: item.rentStartDate || null,
                                    end_date: item.rentEndDate || null,
                                    type: item.type,
                                    armhole: item.type === 'rent' ? (parseFloat(fit.armhole) || 0) : null,
                                    chest: item.type === 'rent' ? (parseFloat(fit.chest) || 0) : null,
                                    waist: item.type === 'rent' ? (parseFloat(fit.waist) || 0) : null,
                                    sleeves: item.type === 'rent' ? (parseFloat(fit.sleeves) || 0) : null,
                                    length: item.type === 'rent' ? (parseFloat(fit.length) || 0) : null
                                };
                            })
                        };

                        const verifyRes = await fetch('/api/rental/bookings/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(verificationData)
                        });

                        if (verifyRes.ok) {
                            setStep('success');
                            clearCart();
                        } else {
                            const err = await verifyRes.json();
                            alert(err.detail || "Payment verification failed");
                        }
                    } catch (err: any) {
                        alert(`Verification failed: ${err.message}`);
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: userName,
                    email: userEmail
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();

        } catch (e: any) {
            alert(`Booking initiation failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = getCartTotal(globalDiscountPercentage, globalDiscountActive);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">
                        {step === 'measurements' && "Select Measurements for Renting"}
                        {step === 'payment' && "Secure Checkout & Payment Gateway"}
                        {step === 'success' && "Order Confirmed!"}
                    </h3>
                    {step !== 'success' && (
                        <button 
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'measurements' && (
                        <form onSubmit={handleProceedToPayment} className="space-y-6">
                            <p className="text-sm text-slate-500 mb-4">
                                Please specify custom measurements for each rental garment in your cart to ensure a perfect fit:
                            </p>
                            {cartItems.map((item, idx) => (
                                <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-sm">{item.name} ({item.category})</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Armhole (in)</label>
                                            <input 
                                                type="number" 
                                                required
                                                min="4" max="24" step="0.5"
                                                value={measurements[item.id]?.armhole || ''}
                                                onChange={(e) => handleMeasurementChange(item.id, 'armhole', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Chest (in)</label>
                                            <input 
                                                type="number" 
                                                required
                                                min="20" max="60" step="0.5"
                                                value={measurements[item.id]?.chest || ''}
                                                onChange={(e) => handleMeasurementChange(item.id, 'chest', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Waist (in)</label>
                                            <input 
                                                type="number" 
                                                required
                                                min="18" max="60" step="0.5"
                                                value={measurements[item.id]?.waist || ''}
                                                onChange={(e) => handleMeasurementChange(item.id, 'waist', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Sleeves (in)</label>
                                            <input 
                                                type="number" 
                                                required
                                                min="2" max="40" step="0.5"
                                                value={measurements[item.id]?.sleeves || ''}
                                                onChange={(e) => handleMeasurementChange(item.id, 'sleeves', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Length (in)</label>
                                            <input 
                                                type="number" 
                                                required
                                                min="10" max="80" step="0.5"
                                                value={measurements[item.id]?.length || ''}
                                                onChange={(e) => handleMeasurementChange(item.id, 'length', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end pt-4">
                                <button 
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-full text-sm hover:shadow-lg transition-all"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'payment' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Payable</p>
                                    <h4 className="text-2xl font-black text-indigo-900">${totalAmount.toFixed(2)}</h4>
                                </div>
                                <span className="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-full uppercase tracking-wider">
                                    Secure Gateway
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cardholder Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="John Doe"
                                        defaultValue="John Doe"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Card Number</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="4111 2222 3333 4444"
                                            defaultValue="4111 2222 3333 4444"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                        />
                                        <svg className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Expiry Date</label>
                                        <input 
                                            type="text" 
                                            placeholder="MM/YY"
                                            defaultValue="12/28"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">CVV</label>
                                        <input 
                                            type="password" 
                                            placeholder="***"
                                            defaultValue="123"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4 border-t border-slate-100">
                                {cartType === 'rent' && (
                                    <button 
                                        onClick={() => setStep('measurements')}
                                        disabled={loading}
                                        className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-full text-sm transition-all"
                                    >
                                        Back to Sizes
                                    </button>
                                )}
                                <button 
                                    onClick={handlePay}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-sm hover:shadow-lg flex items-center justify-center transition-all"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        `Authorize Payment of $${totalAmount.toFixed(2)}`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-slate-800">Payment Successful!</h4>
                                <p className="text-sm text-slate-500 max-w-md mx-auto">
                                    Your order has been registered, and the items have been locked in the calendar availability.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl inline-block text-left text-xs text-slate-500 space-y-1.5 border border-slate-100">
                                <p>📬 <strong>Customer SMS/Email confirmation:</strong> Dispatching confirmation stating your product has been booked.</p>
                                <p>📱 <strong>Admin WhatsApp alert:</strong> Notification detailing customer items, price, type, and dates sent.</p>
                            </div>
                            <div>
                                <button 
                                    onClick={onClose}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-full text-sm hover:shadow-lg transition-all"
                                >
                                    Return to Shopping
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
