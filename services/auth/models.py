from sqlalchemy import Column, Integer, String, Boolean
from database import Base

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
