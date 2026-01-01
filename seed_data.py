import requests
import datetime

CATALOG_URL = "http://localhost:8002"
RENTAL_URL = "http://localhost:8003"

def seed_products():
    products = [
        {
            "name": "Red Evening Gown",
            "description": "Elegant red gown perfect for evening parties.",
            "category": "Party Wear",
            "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 50.0,
            "price_3_days": 120.0,
            "price_7_days": 250.0,
            "color": "Red",
            "size": "M"
        },
        {
            "name": "Blue Silk Saree",
            "description": "Traditional blue silk saree with gold embroidery.",
            "category": "Traditional",
            "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 40.0,
            "price_3_days": 100.0,
            "price_7_days": 200.0,
            "color": "Blue",
            "size": "Free Size"
        },
        {
            "name": "Black Tuxedo",
            "description": "Classic black tuxedo for formal events.",
            "category": "Party Wear",
            "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "price_1_day": 60.0,
            "price_3_days": 150.0,
            "price_7_days": 300.0,
            "color": "Black",
            "size": "L"
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
    # Book product 1 for the next 2 days
    start = datetime.date.today() + datetime.timedelta(days=1)
    end = start + datetime.timedelta(days=2)
    
    booking = {
        "product_id": 1,
        "user_id": 99,
        "start_date": start.isoformat(),
        "end_date": end.isoformat()
    }
    
    try:
        res = requests.post(f"{RENTAL_URL}/bookings", json=booking)
        if res.status_code == 201:
            print("Created dummy booking for product 1")
        else:
            print(f"Failed to create booking: {res.text}")
    except Exception as e:
        print(f"Error creating booking: {e}")

if __name__ == "__main__":
    print("Seeding data...")
    seed_products()
    seed_bookings()
    print("Done!")
