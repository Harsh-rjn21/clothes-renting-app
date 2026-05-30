from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class BookingBase(BaseModel):
    product_id: int
    user_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: str = "rent" # "rent" or "buy"

class BookingCreate(BookingBase):
    pass

class BookingResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    is_block: bool
    type: str

    class Config:
        from_attributes = True

class BlockCreate(BaseModel):
    product_id: int
    start_date: date
    end_date: date

class AvailabilityResponse(BaseModel):
    product_id: int
    booked_dates: List[date]

class MeasurementBase(BaseModel):
    product_id: int
    user_id: int
    armhole: float
    chest: float
    waist: float
    sleeves: float
    length: float

class MeasurementCreate(MeasurementBase):
    booking_id: Optional[int] = None

class MeasurementResponse(MeasurementBase):
    id: int
    booking_id: Optional[int] = None

    class Config:
        from_attributes = True

class RazorpayOrderRequest(BaseModel):
    amount: float

class RazorpayOrderResponse(BaseModel):
    id: str
    amount: int
    currency: str

class BookingItemWithMeasurements(BaseModel):
    product_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: str
    armhole: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    sleeves: Optional[float] = None
    length: Optional[float] = None

class RazorpayVerificationRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    user_id: int
    items: List[BookingItemWithMeasurements]
