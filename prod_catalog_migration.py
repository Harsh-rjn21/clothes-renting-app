import psycopg2

# Connect to the shared PostgreSQL container (service name = db)
conn = psycopg2.connect(
    "postgresql://user:password@db:5432/clothes_renting"
)
cur = conn.cursor()

print("\n=== Running Production Catalog Migration ===\n")

# -------------------------------------------------
# 1. Add missing product columns
# -------------------------------------------------
missing = [
    ("price_subsequent_day", "DOUBLE PRECISION"),
    ("color",               "VARCHAR"),
    ("size",                "VARCHAR"),
    ("available",           "BOOLEAN DEFAULT TRUE")
]

for col, typ in missing:
    try:
        cur.execute(f"ALTER TABLE products ADD COLUMN {col} {typ};")
        print(f"✓ Added column: {col}")
        conn.commit()
    except Exception as e:
        if "already exists" in str(e):
            print(f"- Column already exists: {col}")
        else:
            print(f"! Error adding {col}: {e}")
        conn.rollback()

# -------------------------------------------------
# 2. Drop the old single‑image column (if present)
# -------------------------------------------------
try:
    cur.execute("ALTER TABLE products DROP COLUMN image_url CASCADE;")
    print("✓ Dropped old column: image_url")
    conn.commit()
except Exception as e:
    if "does not exist" in str(e):
        print("- image_url already removed")
    else:
        print(f"! Error dropping image_url: {e}")
    conn.rollback()

# -------------------------------------------------
# 3. Create product_images table
# -------------------------------------------------
try:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS product_images (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            url VARCHAR NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);")
    print("✓ product_images table ready")
    conn.commit()
except Exception as e:
    print(f"! Error creating product_images: {e}")
    conn.rollback()

# -------------------------------------------------
# 4. Create categories table (with defaults)
# -------------------------------------------------
try:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR UNIQUE NOT NULL
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);")
    # Insert default categories (ignore duplicates)
    for cat in ['Party Wear', 'Traditional', 'Casual', 'Formal']:
        cur.execute(
            "INSERT INTO categories (name) VALUES (%s) ON CONFLICT DO NOTHING;",
            (cat,)
        )
    print("✓ categories table ready with default entries")
    conn.commit()
except Exception as e:
    print(f"! Error creating categories: {e}")
    conn.rollback()

print("\n=== Migration finished ===\n")
cur.close()
conn.close()
