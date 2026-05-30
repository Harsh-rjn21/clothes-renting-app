import psycopg2

def migrate_catalog_schema():
    """Migrate catalog database schema to support multi-photo products"""
    try:
        conn = psycopg2.connect("postgresql://user:password@db:5432/clothes_renting")
        cur = conn.cursor()
        
        print("=== Migrating Catalog Database Schema ===\n")
        
        # Step 1: Check if product_images table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'product_images'
            );
        """)
        table_exists = cur.fetchone()[0]
        
        if not table_exists:
            print("Creating product_images table...")
            cur.execute("""
                CREATE TABLE product_images (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    url VARCHAR NOT NULL,
                    is_primary BOOLEAN DEFAULT FALSE
                );
            """)
            cur.execute("CREATE INDEX idx_product_images_product_id ON product_images(product_id);")
            conn.commit()
            print("✓ Created product_images table")
        else:
            print("- product_images table already exists")
        
        # Step 2: Migrate existing image_url data to product_images
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name = 'image_url'
            );
        """)
        has_image_url = cur.fetchone()[0]
        
        if has_image_url:
            print("\nMigrating existing image_url data...")
            # Copy existing image URLs to product_images table
            cur.execute("""
                INSERT INTO product_images (product_id, url, is_primary)
                SELECT id, image_url, TRUE
                FROM products
                WHERE image_url IS NOT NULL AND image_url != '';
            """)
            rows_migrated = cur.rowcount
            print(f"✓ Migrated {rows_migrated} product images")
            
            # Drop the old image_url column
            cur.execute("ALTER TABLE products DROP COLUMN image_url;")
            print("✓ Removed old image_url column")
            conn.commit()
        else:
            print("- image_url column already removed")
        
        # Step 3: Create categories table if it doesn't exist
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'categories'
            );
        """)
        categories_exist = cur.fetchone()[0]
        
        if not categories_exist:
            print("\nCreating categories table...")
            cur.execute("""
                CREATE TABLE categories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL
                );
            """)
            cur.execute("CREATE INDEX idx_categories_name ON categories(name);")
            
            # Add default categories
            default_categories = ['Party Wear', 'Traditional', 'Casual', 'Formal']
            for cat in default_categories:
                cur.execute("INSERT INTO categories (name) VALUES (%s) ON CONFLICT DO NOTHING;", (cat,))
            
            conn.commit()
            print(f"✓ Created categories table with {len(default_categories)} default categories")
        else:
            print("- categories table already exists")
        
        print("\n✓ Catalog schema migration completed successfully!")
        
        # Show final schema
        print("\n=== Current Products Table Schema ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            ORDER BY ordinal_position;
        """)
        for row in cur.fetchall():
            print(f"  - {row[0]}: {row[1]}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_catalog_schema()
