import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Add current directory to path if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def seed():
    db = SessionLocal()
    try:
        # Create tables
        models.Base.metadata.create_all(bind=engine)

        # Clear existing data optionally if you want a clean seed
        # db.query(models.Product).delete()
        # db.query(models.Category).delete()
        # db.commit()

        # Seed Categories
        categories = ["Party Wear", "Traditional", "Casual", "Premium", "Bridal", "Accessories"]
        for cat_name in categories:
            if not db.query(models.Category).filter(models.Category.name == cat_name).first():
                db.add(models.Category(name=cat_name))
        db.commit()

        # Seed Products
        dummy_products = [
            {
                "name": "Midnight Velvet Evening Gown",
                "description": "A stunning deep blue velvet gown with silver embroidery, perfect for gala events and formal dinners.",
                "category": "Premium",
                "image_url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 1200.0,
                "price_subsequent_day": 600.0,
                "color": "Midnight Blue",
                "size": "Medium"
            },
            {
                "name": "Royal Silk Banarasi Saree",
                "description": "Handwoven silk saree with intricate gold motifs. A timeless piece for weddings and traditional celebrations.",
                "category": "Traditional",
                "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 1500.0,
                "price_subsequent_day": 750.0,
                "color": "Emerald Green",
                "size": "Free Size"
            },
            {
                "name": "Classic Tan Leather Jacket",
                "description": "Premium leather jacket with a vintage finish. Adds a touch of rugged elegance to any casual outfit.",
                "category": "Casual",
                "image_url": "https://images.unsplash.com/photo-1551028711-131da507bd89?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 800.0,
                "price_subsequent_day": 400.0,
                "color": "Tan Brown",
                "size": "L"
            },
            {
                "name": "Champagne Sequin Party Dress",
                "description": "Dazzle the crowd in this fitted sequin dress. Designed to catch the light and all the attention.",
                "category": "Party Wear",
                "image_url": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 900.0,
                "price_subsequent_day": 450.0,
                "color": "Champagne Gold",
                "size": "S"
            },
            {
                "name": "Heavily Embroidered Bridal Lehenga",
                "description": "A masterpiece of craftsmanship featuring Zardosi work. Make your special day unforgettable.",
                "category": "Bridal",
                "image_url": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 5000.0,
                "price_subsequent_day": 2500.0,
                "color": "Crimson Red",
                "size": "Adjustable"
            },
            {
                "name": "Crystal Embellished Clutch",
                "description": "The perfect companion for your evening wear. Elegant, compact, and absolutely stunning.",
                "category": "Accessories",
                "image_url": "https://images.unsplash.com/photo-1566150905458-1bf1fd113f0d?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 300.0,
                "price_subsequent_day": 150.0,
                "color": "Silver",
                "size": "Compact"
            },
            {
                "name": "Sleek Black Tuxedo",
                "description": "Tailored to perfection. A classic choice for the modern gentleman who values sophistication.",
                "category": "Premium",
                "image_url": "https://images.unsplash.com/photo-1594932224010-75f430ca0970?auto=format&fit=crop&q=80&w=800",
                "price_1_day": 1800.0,
                "price_subsequent_day": 900.0,
                "color": "Onyx Black",
                "size": "42R"
            }
        ]

        for p_data in dummy_products:
            image_url = p_data.pop("image_url")
            existing_product = db.query(models.Product).filter(models.Product.name == p_data["name"]).first()
            if not existing_product:
                new_product = models.Product(**p_data)
                db.add(new_product)
                db.flush() # Get ID
                
                # Add initial image
                db.add(models.ProductImage(product_id=new_product.id, url=image_url, is_primary=True))
                
                # Add a second dummy image for demonstration if it's the first product
                if p_data["name"] == "Midnight Velvet Evening Gown":
                    db.add(models.ProductImage(
                        product_id=new_product.id, 
                        url="https://images.unsplash.com/photo-1539008835657-9e8e62f80232?auto=format&fit=crop&q=80&w=800", 
                        is_primary=False
                    ))
        
        db.commit()
        print("Database Seeded Successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
