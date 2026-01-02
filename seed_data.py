import os
import requests
import datetime

# Use environment variables if provided, else default to localhost with ports (dev)
# For production, set these to http://localhost/api/catalog etc.
CATALOG_URL = os.getenv("CATALOG_URL", "http://localhost:8002").rstrip("/")
RENTAL_URL = os.getenv("RENTAL_URL", "http://localhost:8003").rstrip("/")

def seed_products():
    products = [
        {
            "name": "Red Evening Gown",
            "description": "Elegant red gown perfect for evening parties. High quality silk.",
            "category": "Party Wear",
            "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 1500.0,
            "price_subsequent_day": 800.0,
            "color": "Red",
            "size": "M"
        },
        {
            "name": "Blue Silk Saree",
            "description": "Traditional blue silk saree with gold embroidery. Ideal for weddings.",
            "category": "Traditional",
            "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 1200.0,
            "price_subsequent_day": 600.0,
            "color": "Blue",
            "size": "Free Size"
        },
        {
            "name": "Black Tuxedo",
            "description": "Classic black tuxedo for formal events. Includes blazer and pants.",
            "category": "Party Wear",
            "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 2000.0,
            "price_subsequent_day": 1000.0,
            "color": "Black",
            "size": "L"
        },
        {
            "name": "Designer Sherwani",
            "description": "Cream and gold designer sherwani for grooms and festive occasions.",
            "category": "Traditional",
            "image_url": "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 2500.0,
            "price_subsequent_day": 1500.0,
            "color": "Cream",
            "size": "XL"
        },
        {
            "name": "Floral Summer Dress",
            "description": "Lightweight and breezy floral dress for casual outings.",
            "category": "Casual",
            "image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 500.0,
            "price_subsequent_day": 300.0,
            "color": "Floral",
            "size": "S"
        },
        {
            "name": "Pearl Necklace Set",
            "description": "Exquisite pearl necklace with matching earrings.",
            "category": "Accessories",
            "image_url": "https://images.unsplash.com/photo-1535633302703-b0703af2953a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 300.0,
            "price_subsequent_day": 150.0,
            "color": "White",
            "size": "One Size"
        },
        {
            "name": "Leather Handbag",
            "description": "Premium brown leather handbag for a sophisticated look.",
            "category": "Accessories",
            "image_url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 400.0,
            "price_subsequent_day": 200.0,
            "color": "Brown",
            "size": "Medium"
        }
    ]

    for p in products:
        try:
            res = requests.post(f"{CATALOG_URL}/products", json=p)
            if res.status_code == 201:
                print(f"Created product: {p['name']}")
            else:
                print(f"Failed to create {p['name']}: {res.text}")
        except Exception as e:
            print(f"Error creating {p['name']}: {e}")

def seed_bookings():
    # Example block/booking can be added here if needed
    pass

if __name__ == "__main__":
    print("Seeding data...")
    seed_products()
    print("Done!")
