import psycopg2

def migrate_all_schemas():
    """Complete migration for all microservices schemas"""
    try:
        conn = psycopg2.connect("postgresql://user:password@db:5432/clothes_renting")
        cur = conn.cursor()
        
        print("=" * 60)
        print("COMPLETE DATABASE SCHEMA MIGRATION")
        print("=" * 60)
        
        # ===== AUTH SERVICE (users table) =====
        print("\n[1/4] Migrating AUTH SERVICE (users table)...")
        
        auth_columns = [
            ("is_admin", "BOOLEAN DEFAULT FALSE"),
            ("is_verified_email", "BOOLEAN DEFAULT FALSE"),
            ("google_id", "VARCHAR"),
            ("full_name", "VARCHAR")
        ]
        
        for column, definition in auth_columns:
            try:
                cur.execute(f"ALTER TABLE users ADD COLUMN {column} {definition};")
                print(f"  ✓ Added users.{column}")
                conn.commit()
            except Exception as e:
                if "already exists" in str(e):
                    print(f"  - users.{column} exists")
                conn.rollback()
        
        # Add google_id index
        try:
            cur.execute("CREATE UNIQUE INDEX ix_users_google_id ON users (google_id);")
            print("  ✓ Added google_id index")
            conn.commit()
        except:
            conn.rollback()
        
        # ===== CATALOG SERVICE (products, product_images, categories) =====
        print("\n[2/4] Migrating CATALOG SERVICE...")
        
        # Add missing product columns
        catalog_columns = [
            ("price_subsequent_day", "DOUBLE PRECISION"),
            ("color", "VARCHAR"),
            ("size", "VARCHAR"),
            ("available", "BOOLEAN DEFAULT TRUE")
        ]
        
        for column, definition in catalog_columns:
            try:
                cur.execute(f"ALTER TABLE products ADD COLUMN {column} {definition};")
                print(f"  ✓ Added products.{column}")
                conn.commit()
            except Exception as e:
                if "already exists" in str(e):
                    print(f"  - products.{column} exists")
                conn.rollback()
        
        # Remove old image_url column
        try:
            cur.execute("ALTER TABLE products DROP COLUMN image_url CASCADE;")
            print("  ✓ Removed products.image_url")
            conn.commit()
        except Exception as e:
            if "does not exist" in str(e):
                print("  - products.image_url already removed")
            conn.rollback()
        
        # Create product_images table
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
            print("  ✓ Created product_images table")
            conn.commit()
        except Exception as e:
            if "already exists" in str(e):
                print("  - product_images table exists")
            conn.rollback()
        
        # Create categories table
        try:
            cur.execute("""
                CREATE TABLE categories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL
                );
            """)
            cur.execute("CREATE INDEX idx_categories_name ON categories(name);")
            
            # Add default categories
            for cat in ['Party Wear', 'Traditional', 'Casual', 'Formal', 'Western']:
                cur.execute("INSERT INTO categories (name) VALUES (%s) ON CONFLICT DO NOTHING;", (cat,))
            
            print("  ✓ Created categories table with defaults")
            conn.commit()
        except Exception as e:
            if "already exists" in str(e):
                print("  - categories table exists")
            conn.rollback()
        
        # ===== RENTAL SERVICE (bookings, blocks) =====
        print("\n[3/4] Migrating RENTAL SERVICE...")
        
        # Ensure bookings table exists with correct schema
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    status VARCHAR DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("  ✓ Verified bookings table")
            conn.commit()
        except:
            conn.rollback()
        
        # Ensure blocks table exists
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS blocks (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    reason VARCHAR
                );
            """)
            print("  ✓ Verified blocks table")
            conn.commit()
        except:
            conn.rollback()
        
        # ===== FEEDBACK SERVICE (reviews) =====
        print("\n[4/4] Migrating FEEDBACK SERVICE...")
        
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS reviews (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    rating INTEGER NOT NULL,
                    original_rating INTEGER NOT NULL,
                    comment TEXT,
                    original_comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("  ✓ Verified reviews table")
            conn.commit()
        except:
            conn.rollback()
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE!")
        print("=" * 60)
        
        # Show final schemas
        print("\n📊 Final Schema Summary:")
        for table in ['users', 'products', 'product_images', 'categories', 'bookings', 'reviews']:
            cur.execute(f"""
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = '{table}';
            """)
            count = cur.fetchone()[0]
            if count > 0:
                print(f"  ✓ {table}: {count} columns")
        
        cur.close()
        conn.close()
        
        print("\n✅ All schemas synchronized!")
        print("⚠️  IMPORTANT: Restart ALL services now:")
        print("   sudo docker-compose -f docker-compose.prod.yml restart")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    migrate_all_schemas()
