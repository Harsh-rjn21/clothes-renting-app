from sqlalchemy import Column, Integer, Date, String, Boolean
from database import Base

class RentalBooking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default="confirmed") # confirmed, cancelled
    is_block = Column(Boolean, default=False)
