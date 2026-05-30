from sqlalchemy import Column, Integer, Date, String, Boolean, Float
from database import Base

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
