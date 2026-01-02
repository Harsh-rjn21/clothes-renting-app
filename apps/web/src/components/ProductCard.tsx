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
    price_1_day: number;
    available: boolean;
}

const ProductCard = ({ product }: { product: Product }) => {
    return (
        <Link href={`/products/${product.id}`} className="group">
            <div className="relative overflow-hidden rounded-2xl bg-slate-100 aspect-[3/4]">
                <img
                    src={product.images?.[0]?.url || "https://dummyimage.com/600x800/e2e8f0/64748b&text=Elegant+Style"}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span className="text-white text-sm font-bold bg-indigo-600 px-4 py-2 rounded-full w-full text-center shadow-lg">
                        View Details
                    </span>
                </div>
                {!product.available && (
                    <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                        Unavailable
                    </div>
                )}
            </div>
            <div className="mt-4 space-y-1 px-1">
                <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                </div>
                <p className="text-sm font-medium text-slate-500">{product.category}</p>
                <div className="pt-1 flex items-baseline space-x-1">
                    <span className="text-sm font-bold text-slate-900">Rs. {product.price_1_day}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">/ day</span>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
