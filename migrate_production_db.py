import psycopg2

def migrate_database():
    """Add missing columns to the users table in production"""
    try:
        conn = psycopg2.connect("postgresql://user:password@db:5432/clothes_renting")
        cur = conn.cursor()
        
        print("Checking and adding missing columns to users table...")
        
        # Add is_admin column
        try:
            cur.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;")
            print("✓ Added 'is_admin' column")
        except Exception as e:
            if "already exists" in str(e):
                print("- 'is_admin' already exists")
            else:
                print(f"! Error adding is_admin: {e}")
            conn.rollback()
            cur = conn.cursor()
        
        # Add is_verified_email column
        try:
            cur.execute("ALTER TABLE users ADD COLUMN is_verified_email BOOLEAN DEFAULT FALSE;")
            print("✓ Added 'is_verified_email' column")
        except Exception as e:
            if "already exists" in str(e):
                print("- 'is_verified_email' already exists")
            else:
                print(f"! Error adding is_verified_email: {e}")
            conn.rollback()
            cur = conn.cursor()
        
        # Add google_id column
        try:
            cur.execute("ALTER TABLE users ADD COLUMN google_id VARCHAR;")
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id);")
            print("✓ Added 'google_id' column and index")
        except Exception as e:
            if "already exists" in str(e):
                print("- 'google_id' already exists")
            else:
                print(f"! Error adding google_id: {e}")
            conn.rollback()
            cur = conn.cursor()
        
        # Add full_name column
        try:
            cur.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR;")
            print("✓ Added 'full_name' column")
        except Exception as e:
            if "already exists" in str(e):
                print("- 'full_name' already exists")
            else:
                print(f"! Error adding full_name: {e}")
            conn.rollback()
            cur = conn.cursor()
        
        conn.commit()
        print("\n✓ Database migration completed successfully!")
        
        # Show current schema
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        """)
        print("\nCurrent users table schema:")
        for row in cur.fetchall():
            print(f"  - {row[0]}: {row[1]}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_database()
