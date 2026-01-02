import psycopg2
import os

# Database connection details (assuming default postgres/postgres)
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "clothes_renting_db"
DB_USER = "postgres"
DB_PASSWORD = "password"

def fix_db():
    conn_str = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        # Add columns if they don't exist
        
        # Products
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS price_subsequent_day FLOAT DEFAULT 0.0;")
        print("Updated products table.")
        
        # Users
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;")
        print("Updated users table.")
        
        # Reviews
        cur.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS original_comment TEXT;")
        print("Updated reviews table.")
        
        # Bookings (Rental)
        cur.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_block BOOLEAN DEFAULT FALSE;")
        print("Updated bookings table.")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database schema fixed successfully!")
        
    except Exception as e:
        print(f"Error fixing database: {e}")

if __name__ == "__main__":
    fix_db()
