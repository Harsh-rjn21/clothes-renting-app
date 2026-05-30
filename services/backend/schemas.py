from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime

# === Auth Service Schemas ===
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    instagram_id: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_verified_email: bool
    is_verified_phone: bool
    google_id: Optional[str] = None

    class Config:
        from_attributes = True

class GoogleLogin(BaseModel):
    id_token: str

class InstagramLogin(BaseModel):
    instagram_id: str
    full_name: Optional[str] = None

class FacebookLogin(BaseModel):
    access_token: str

class VerificationSend(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class VerificationConfirm(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# === Catalog Service Schemas ===
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
    type: str = "rent" # "rent" or "buy"
    price_buy: Optional[float] = None
    price_buy_sale: Optional[float] = None
    price_rent_3day: Optional[float] = None
    price_rent_3day_sale: Optional[float] = None
    price_rent_subsequent: Optional[float] = None
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

class GlobalDiscountBase(BaseModel):
    percentage: float
    is_active: bool

class GlobalDiscountCreate(GlobalDiscountBase):
    pass

class GlobalDiscountResponse(GlobalDiscountBase):
    id: int

    class Config:
        from_attributes = True

# === Rental Service Schemas ===
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

# === Feedback Service Schemas ===
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
