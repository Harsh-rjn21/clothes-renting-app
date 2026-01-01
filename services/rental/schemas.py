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

class BookingResponse(BookingBase):
    id: int
    status: str

    class Config:
        orm_mode = True

class AvailabilityResponse(BaseModel):
    product_id: int
    booked_dates: List[date] 
