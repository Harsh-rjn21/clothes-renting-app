"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string; // unique cart item id (e.g. product_id + dates for rent, or product_id for buy)
    productId: number;
    name: string;
    image: string;
    category: string;
    type: 'rent' | 'buy';
    originalPrice: number;
    price: number;
    // Rental specific fields
    rentStartDate?: string;
    rentEndDate?: string;
    rentDays?: number;
    priceRentSubsequent?: number;
}

interface CartContextType {
    cartItems: CartItem[];
    cartType: 'rent' | 'buy' | null;
    addToCart: (item: Omit<CartItem, 'id'>) => { success: boolean; message?: string };
    removeFromCart: (cartItemId: string) => void;
    clearCart: () => void;
    getCartTotal: (globalDiscountPercentage?: number, globalDiscountActive?: boolean) => number;
    cartCount: number;
    warningMessage: string | null;
    setWarningMessage: (msg: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('rental_rewards_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error loading cart", e);
            }
        }
    }, []);

    // Save cart to localStorage
    const saveCart = (items: CartItem[]) => {
        setCartItems(items);
        localStorage.setItem('rental_rewards_cart', JSON.stringify(items));
    };

    const cartType: 'rent' | 'buy' | null = cartItems.length > 0 ? cartItems[0].type : null;

    const addToCart = (newItem: Omit<CartItem, 'id'>) => {
        // Rule: User must be logged in before adding to cart
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login page
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return { success: false, message: "Please log in to add items to your cart." };
        }

        // Rule: Cart Isolation Rule (no mixed cart)
        if (cartItems.length > 0 && cartItems[0].type !== newItem.type) {
            const message = "Mixed Cart: Your cart can only contain items to rent OR buy. Please clear your cart to add this item.";
            setWarningMessage(message);
            return { success: false, message };
        }

        // Generate unique cart item ID
        const id = newItem.type === 'rent' 
            ? `${newItem.productId}-${newItem.rentStartDate}-${newItem.rentEndDate}`
            : `${newItem.productId}`;

        // Check if item already exists in cart
        const existingItem = cartItems.find(item => item.id === id);
        if (existingItem) {
            return { success: true, message: "Item is already in your cart." };
        }

        const updatedCart = [...cartItems, { ...newItem, id }];
        saveCart(updatedCart);
        return { success: true };
    };

    const removeFromCart = (cartItemId: string) => {
        const updatedCart = cartItems.filter(item => item.id !== cartItemId);
        saveCart(updatedCart);
    };

    const clearCart = () => {
        saveCart([]);
        setWarningMessage(null);
    };

    const getCartTotal = (globalDiscountPercentage: number = 0, globalDiscountActive: boolean = false) => {
        return cartItems.reduce((total, item) => {
            let activePrice = item.price;
            
            // Apply global discount if active
            if (globalDiscountActive && globalDiscountPercentage > 0) {
                // If renting: global discount applies ONLY to the base 3-day price (originalPrice), not add-ons
                if (item.type === 'rent' && item.rentDays && item.priceRentSubsequent) {
                    const discountedBase = item.originalPrice * (1 - globalDiscountPercentage / 100);
                    const addOnDays = Math.max(0, item.rentDays - 3);
                    const addOnPrice = addOnDays * item.priceRentSubsequent;
                    activePrice = discountedBase + addOnPrice;
                } else {
                    // For buying: applies to the actual base price
                    activePrice = item.originalPrice * (1 - globalDiscountPercentage / 100);
                }
            }
            return total + activePrice;
        }, 0);
    };

    const cartCount = cartItems.length;

    return (
        <CartContext.Provider value={{
            cartItems,
            cartType,
            addToCart,
            removeFromCart,
            clearCart,
            getCartTotal,
            cartCount,
            warningMessage,
            setWarningMessage
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
