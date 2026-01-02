from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_verified_email: bool
    google_id: Optional[str] = None

    class Config:
        from_attributes = True

class GoogleLogin(BaseModel):
    id_token: str

class VerificationSend(BaseModel):
    email: EmailStr

class VerificationConfirm(BaseModel):
    email: EmailStr
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
