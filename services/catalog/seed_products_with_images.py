import requests
import io
import time

# Internal URL for catalog service within the docker network
BASE = "http://localhost:8000"

def seed():
    print("=== Seeding Products with Images ===\n")
    
    products = [
        {
            "name": "Red Evening Gown",
            "description": "Elegant red gown perfect for evening parties. Premium silk fabric with delicate embroidery.",
            "category": "Party Wear",
            "price_1_day": 1500.0,
            "price_subsequent_day": 800.0,
            "color": "Red",
            "size": "M"
        },
        {
            "name": "Blue Silk Saree",
            "description": "Traditional blue silk saree with gold border. Perfect for weddings and festivals.",
            "category": "Traditional",
            "price_1_day": 1200.0,
            "price_subsequent_day": 600.0,
            "color": "Blue",
            "size": "Free Size"
        },
        {
            "name": "Black Formal Tuxedo",
            "description": "Classic black tuxedo for formal events. Includes jacket and trousers.",
            "category": "Formal",
            "price_1_day": 2000.0,
            "price_subsequent_day": 1000.0,
            "color": "Black",
            "size": "L"
        }
    ]

    # Sample image URLs from Unsplash for realistic placeholder data
    image_urls = [
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610030469668-93530c1195cf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1594932224828-b4b057b69b82?auto=format&fit=crop&w=800&q=80"
    ]

    for i, p in enumerate(products):
        try:
            # Create product
            r = requests.post(f"{BASE}/products", json=p)
            if r.ok:
                product_id = r.json()["id"]
                print(f"✓ Created: {p['name']} (ID: {product_id})")
                
                # Download and upload image
                try:
                    img_data = requests.get(image_urls[i]).content
                    files = {'file': ('product.jpg', io.BytesIO(img_data), 'image/jpeg')}
                    img_r = requests.post(f"{BASE}/products/{product_id}/images/upload", files=files)
                    if img_r.ok:
                        print(f"  ✓ Uploaded image for {p['name']}")
                    else:
                        print(f"  ! Image upload failed for {p['name']}: {img_r.status_code}")
                except Exception as img_e:
                    print(f"  ! Error uploading image for {p['name']}: {img_e}")
            else:
                print(f"! Failed to create {p['name']}: {r.status_code} - {r.text}")
        except Exception as e:
            print(f"! Error creating {p['name']}: {e}")
        
    print("\n=== Seeding Complete ===")

if __name__ == "__main__":
    # Wait a bit for the service to be ready after restart
    time.sleep(2)
    seed()
