from pydantic import BaseModel
from datetime import date
from typing import List

class BookingBase(BaseModel):
    product_id: int
    user_id: int
    start_date: date
    end_date: date

class BookingCreate(BookingBase):
    pass

class BookingResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    start_date: date
    end_date: date
    status: str
    is_block: bool

    class Config:
        from_attributes = True

class BlockCreate(BaseModel):
    product_id: int
    start_date: date
    end_date: date

class AvailabilityResponse(BaseModel):
    product_id: int
    booked_dates: List[date]
