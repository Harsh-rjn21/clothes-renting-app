import psycopg2
import os
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    try:
        # Connect to the database
        db_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/clothes_renting")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Admin email
        admin_email = "harshranjan1221@gmail.com"
        admin_password = "admin123"  # Change this to your preferred password
        admin_name = "Harsh Ranjan"
        
        # Hash the password
        hashed_password = pwd_context.hash(admin_password)
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        existing_user = cur.fetchone()
        
        if existing_user:
            # Update existing user to be verified admin
            cur.execute("""
                UPDATE users 
                SET is_admin = TRUE, 
                    is_verified_email = TRUE,
                    hashed_password = %s,
                    full_name = %s
                WHERE email = %s
            """, (hashed_password, admin_name, admin_email))
            print(f"Updated existing user {admin_email} to verified admin")
        else:
            # Create new verified admin user
            cur.execute("""
                INSERT INTO users (email, hashed_password, full_name, is_admin, is_verified_email, is_active)
                VALUES (%s, %s, %s, TRUE, TRUE, TRUE)
            """, (admin_email, hashed_password, admin_name))
            print(f"Created new verified admin user: {admin_email}")
        
        conn.commit()
        print(f"\n✓ Admin account ready!")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print(f"  Status: Verified & Admin")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_admin_user()
