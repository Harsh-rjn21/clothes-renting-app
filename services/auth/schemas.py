from pydantic import BaseModel, EmailStr
from typing import Optional

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
