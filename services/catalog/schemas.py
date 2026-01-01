from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    price_1_day: float
    price_3_days: float
    price_7_days: float
    color: Optional[str] = None
    size: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    available: bool

    class Config:
        orm_mode = True
