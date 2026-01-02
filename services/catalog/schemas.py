from pydantic import BaseModel
from typing import List, Optional

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class ProductImageBase(BaseModel):
    url: str
    is_primary: bool = False

class ProductImageResponse(ProductImageBase):
    id: int
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price_1_day: float
    price_subsequent_day: float
    color: Optional[str] = None
    size: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    available: bool
    images: List[ProductImageResponse] = []

    class Config:
        from_attributes = True

