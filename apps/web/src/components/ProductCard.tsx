"use client";

import Link from 'next/link';

interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
}

interface Product {
    id: number;
    name: string;
    category: string;
    images: ProductImage[];
    type: 'rent' | 'buy';
    price_buy?: number;
    price_buy_sale?: number;
    price_rent_3day?: number;
    price_rent_3day_sale?: number;
    price_rent_subsequent?: number;
    available: boolean;
}

interface ProductCardProps {
    product: Product;
    globalDiscountPercentage?: number;
    globalDiscountActive?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
    product, 
    globalDiscountPercentage = 0, 
    globalDiscountActive = false 
}) => {
    // Determine active prices
    let originalPrice = 0;
    let salePrice: number | null = null;

    if (product.type === 'buy') {
        originalPrice = product.price_buy || 0;
        if (globalDiscountActive && globalDiscountPercentage > 0) {
            salePrice = originalPrice * (1 - globalDiscountPercentage / 100);
        } else if (product.price_buy_sale && product.price_buy_sale < originalPrice) {
            salePrice = product.price_buy_sale;
        }
    } else {
        originalPrice = product.price_rent_3day || 0;
        if (globalDiscountActive && globalDiscountPercentage > 0) {
            salePrice = originalPrice * (1 - globalDiscountPercentage / 100);
        } else if (product.price_rent_3day_sale && product.price_rent_3day_sale < originalPrice) {
            salePrice = product.price_rent_3day_sale;
        }
    }

    const handleWhatsAppEnquiry = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const adminPhoneNumber = "916206430920"; // Replace with your target admin number
        const itemType = product.type === 'rent' ? "Rent" : "Buy";
        const messageText = `Hi, I would like to enquire about ${product.name} (${itemType}) in the category ${product.category}.`;
        const waUrl = `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <Link href={`/products/${product.id}`} className="group block bg-white rounded-2xl border border-slate-100 p-3 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
            <div className="relative overflow-hidden rounded-xl bg-slate-50 aspect-[3/4]">
                <img
                    src={product.images?.[0]?.url || "https://dummyimage.com/600x800/e2e8f0/64748b&text=Elegant+Style"}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col space-y-1.5 z-10">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm text-white ${
                        product.type === 'rent' ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}>
                        {product.type === 'rent' ? 'To Rent' : 'To Buy'}
                    </span>
                </div>

                {!product.available && (
                    <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm z-10">
                        Unavailable
                    </div>
                )}
            </div>
            
            <div className="mt-3 space-y-1 px-1">
                <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {product.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400">{product.category}</p>
                
                <div className="pt-1 flex items-baseline justify-between">
                    <div className="flex items-baseline space-x-1.5">
                        {salePrice !== null ? (
                            <>
                                <span className="text-sm font-black text-slate-900">${salePrice.toFixed(2)}</span>
                                <span className="text-xs text-slate-400 line-through">${originalPrice.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="text-sm font-black text-slate-900">${originalPrice.toFixed(2)}</span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {product.type === 'rent' ? '/ 3 days' : ''}
                        </span>
                    </div>
                    {product.type === 'rent' && product.price_rent_subsequent && (
                        <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            +${product.price_rent_subsequent}/day
                        </span>
                    )}
                </div>

                {/* WhatsApp Enquiry Button */}
                <div className="pt-2">
                    <button 
                        onClick={handleWhatsAppEnquiry}
                        className="w-full flex items-center justify-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328.002 11.94.002c3.205.001 6.216 1.248 8.48 3.515 2.264 2.268 3.51 5.281 3.508 8.487-.005 6.617-5.33 11.939-11.941 11.939-2.006-.001-3.974-.503-5.727-1.458L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.6 1.45a9.8 9.8 0 0 0 9.8-9.8c0-5.4-4.4-9.8-9.8-9.8S1.5 5.4 1.5 10.8c0 1.6.45 3.2 1.4 4.8l-1 3.6 3.7-1zm12.3-5.4c-.3-.15-1.7-.85-2.0-.95-.3-.1-.5-.15-.7.15-.2.3-.7.9-.9 1.1-.2.2-.4.25-.7.1-1.7-.8-2.9-1.5-3.8-2.4-.7-.6-1.1-1.3-1.2-1.6 0-.3.25-.5.4-.65.1-.15.25-.3.35-.4.1-.1.15-.2.2-.3.05-.1.02-.2-.02-.3-.05-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.15.2 2.3 3.6 5.7 5s4.2 1.1 5.7 1c1.5-.1 3.1-1.1 3.5-2.1.4-1 .4-1.9.3-2.1-.1-.2-.4-.3-.7-.45z"/>
                        </svg>
                        <span>Enquire More</span>
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
