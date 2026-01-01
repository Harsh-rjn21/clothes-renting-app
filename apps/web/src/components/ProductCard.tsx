import Link from 'next/link';
import Image from 'next/image';

interface Product {
    id: number;
    name: string;
    category: string;
    image_url?: string;
    price_3_days: float;
    available: boolean;
}

const ProductCard = ({ product }: { product: Product }) => {
    return (
        <div className="group relative">
            <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                <img
                    src={product.image_url || "https://dummyimage.com/600x400/000/fff&text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                />
            </div>
            <div className="mt-4 flex justify-between">
                <div>
                    <h3 className="text-sm text-gray-700">
                        <Link href={`/products/${product.id}`}>
                            <span aria-hidden="true" className="absolute inset-0" />
                            {product.name}
                        </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">${product.price_3_days}/3days</p>
            </div>
            {!product.available && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Rented
                </div>
            )}
        </div>
    );
};

export default ProductCard;
