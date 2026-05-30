from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# === Auth Service Models ===
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Nullable for Google-only users
    phone_number = Column(String, nullable=True)
    instagram_id = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified_email = Column(Boolean, default=False)
    is_verified_phone = Column(Boolean, default=False)
    google_id = Column(String, unique=True, index=True, nullable=True)
    facebook_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)

# === Catalog Service Models ===
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, index=True)
    
    type = Column(String, default="rent") # "rent" or "buy"
    price_buy = Column(Float, nullable=True)
    price_buy_sale = Column(Float, nullable=True)
    price_rent_3day = Column(Float, nullable=True)
    price_rent_3day_sale = Column(Float, nullable=True)
    price_rent_subsequent = Column(Float, nullable=True)
    
    available = Column(Boolean, default=True)
    color = Column(String, nullable=True)
    size = Column(String, nullable=True)

    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    url = Column(String)
    is_primary = Column(Boolean, default=False)

    product = relationship("Product", back_populates="images")

class GlobalDiscount(Base):
    __tablename__ = "global_discounts"

    id = Column(Integer, primary_key=True, index=True)
    percentage = Column(Float, default=0.0) # e.g. 10.0 for 10%
    is_active = Column(Boolean, default=False)

# === Rental Service Models ===
class RentalBooking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String, default="confirmed") # confirmed, cancelled
    is_block = Column(Boolean, default=False)
    type = Column(String, default="rent") # "rent" or "buy"

class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, nullable=True, index=True)
    product_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    armhole = Column(Float)
    chest = Column(Float)
    waist = Column(Float)
    sleeves = Column(Float)
    length = Column(Float)

# === Feedback Service Models ===
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    rating = Column(Integer)
    comment = Column(Text, nullable=True)
    original_comment = Column(Text, nullable=True)
    original_rating = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
