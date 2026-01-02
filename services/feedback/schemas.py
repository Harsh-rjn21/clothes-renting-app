from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    comment: Optional[str] = None
    rating: Optional[int] = None

class ReviewResponse(ReviewBase):
    id: int
    original_comment: Optional[str] = None
    original_rating: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
