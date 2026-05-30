import sys
import os

# Prepend services/backend to sys.path to easily import database & models
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'services', 'backend'))
sys.path.insert(0, backend_path)

print("Initializing local SQLite database using consolidated backend modules...")

try:
    import database
    import models

    # Create all tables on the consolidated Base
    models.Base.metadata.create_all(bind=database.engine)
    print("  [OK] Created all consolidated database tables (users, categories, products, product_images, global_discounts, bookings, measurements, reviews)")

    # Seed default categories
    db = database.SessionLocal()
    existing_cats = db.query(models.Category).all()
    if not existing_cats:
        for cat_name in ['Bridal', 'Non-bridal', 'Lehenga', 'Saree', 'Top', 'Gown']:
            db.add(models.Category(name=cat_name))
        db.commit()
        print("  [OK] Seeded default product categories")
    db.close()
    
    print(f"\nDatabase initialization complete! {database.DATABASE_URL} is ready.")

except Exception as e:
    print(f"\n[FAIL] Database initialization failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
