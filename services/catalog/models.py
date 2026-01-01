from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, index=True)
    image_url = Column(String, nullable=True)
    
    price_1_day = Column(Float)
    price_3_days = Column(Float)
    price_7_days = Column(Float)
    
    available = Column(Boolean, default=True)
    color = Column(String, nullable=True)
    size = Column(String, nullable=True)
