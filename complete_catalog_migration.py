import psycopg2

def complete_catalog_migration():
    """Complete migration to sync production catalog schema with current code"""
    try:
        conn = psycopg2.connect("postgresql://user:password@db:5432/clothes_renting")
        cur = conn.cursor()
        
        print("=== Complete Catalog Schema Migration ===\n")
        
        # Step 1: Add missing columns to products table
        print("Step 1: Adding missing columns to products table...")
        
        columns_to_add = [
            ("price_subsequent_day", "DOUBLE PRECISION"),
            ("color", "VARCHAR"),
            ("size", "VARCHAR"),
        ]
        
        for column_name, column_type in columns_to_add:
            try:
                cur.execute(f"ALTER TABLE products ADD COLUMN {column_name} {column_type};")
                print(f"  ✓ Added '{column_name}'")
                conn.commit()
            except Exception as e:
                if "already exists" in str(e):
                    print(f"  - '{column_name}' already exists")
                else:
                    print(f"  ! Error adding {column_name}: {e}")
                conn.rollback()
        
        # Step 2: Remove old image_url column if it exists
        print("\nStep 2: Removing old image_url column...")
        try:
            cur.execute("ALTER TABLE products DROP COLUMN image_url CASCADE;")
            print("  ✓ Removed 'image_url' column")
            conn.commit()
        except Exception as e:
            if "does not exist" in str(e):
                print("  - 'image_url' already removed")
            else:
                print(f"  ! Error: {e}")
            conn.rollback()
        
        # Step 3: Create product_images table
        print("\nStep 3: Creating product_images table...")
        try:
            cur.execute("""
                CREATE TABLE product_images (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    url VARCHAR NOT NULL,
                    is_primary BOOLEAN DEFAULT FALSE
                );
            """)
            cur.execute("CREATE INDEX idx_product_images_product_id ON product_images(product_id);")
            print("  ✓ Created product_images table with index")
            conn.commit()
        except Exception as e:
            if "already exists" in str(e):
                print("  - product_images table already exists")
            else:
                print(f"  ! Error: {e}")
            conn.rollback()
        
        # Step 4: Create categories table
        print("\nStep 4: Creating categories table...")
        try:
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
            
            print(f"  ✓ Created categories table with {len(default_categories)} default categories")
            conn.commit()
        except Exception as e:
            if "already exists" in str(e):
                print("  - categories table already exists")
            else:
                print(f"  ! Error: {e}")
            conn.rollback()
        
        print("\n=== Migration Complete! ===\n")
        
        # Show final schema
        print("Final products table schema:")
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
        
        print("\n✓ All done! Restart the catalog service now.")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    complete_catalog_migration()
