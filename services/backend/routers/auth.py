from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
import random
from typing import List
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import os
import sys

# Ensure parent directory is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import database
import models
import schemas
import utils

router = APIRouter()

# Admin Emails Allowlist
ADMIN_EMAILS = ["admin@example.com", "harsh@example.com", "harshranjan1221@gmail.com", "connect.local.1221@gmail.com"]

# In-memory store for verification codes (Dev only)
verification_codes = {}

# Email Config
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "mock@example.com"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@stylerent.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

def send_smtp_email(to_email: str, code: str):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    try:
        sender_email = "connect.local.1221@gmail.com"
        sender_password = "hfyx ujzx dsgq jcqw"
        
        msg = MIMEMultipart()
        msg['From'] = f"StyleRent <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = "StyleRent Verification Code"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Welcome to StyleRent!</h2>
                <p>Thank you for signing up. Please use the following 6-digit verification code to unlock your account:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #4f46e5; margin: 20px 0;">
                    {code}
                </div>
                <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 11px; color: #9ca3af;">StyleRent Rewards © 2026. All rights reserved.</p>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        print(f"EMAIL SENT successfully to {to_email}")
    except Exception as e:
        print(f"FAILED TO SEND EMAIL to {to_email}: {e}")

def send_verification_logic(email: str = None, phone_number: str = None):
    import threading
    key = email if email else phone_number
    if not key:
        return
    code = f"{random.randint(100000, 999999)}"
    verification_codes[key] = {"code": code, "expires": datetime.utcnow() + timedelta(minutes=10)}
    
    # Still print to terminal for easy local checking
    print(f"VERIFICATION CODE FOR {key}: {code}")
    
    if email:
        thread = threading.Thread(target=send_smtp_email, args=(email, code))
        thread.start()

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if not user.email and not user.phone_number:
        raise HTTPException(status_code=400, detail="Must provide email or phone number")
        
    if user.email:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    if user.phone_number:
        db_user = db.query(models.User).filter(models.User.phone_number == user.phone_number).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    is_admin = user.email in ADMIN_EMAILS if user.email else False
    hashed_password = utils.get_password_hash(user.password) if user.password else None
    new_user = models.User(
        email=user.email, 
        phone_number=user.phone_number,
        instagram_id=user.instagram_id,
        hashed_password=hashed_password, 
        full_name=user.full_name,
        is_admin=is_admin,
        is_verified_phone=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Trigger Verification Code
    if new_user.email:
        send_verification_logic(email=new_user.email)
    elif new_user.phone_number:
        send_verification_logic(phone_number=new_user.phone_number)
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        (models.User.email == form_data.username) | 
        (models.User.phone_number == form_data.username)
    ).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Sync admin status during login
    is_admin = user.email in ADMIN_EMAILS if user.email else False
    if is_admin != user.is_admin:
        user.is_admin = is_admin
        db.commit()
        db.refresh(user)
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={
            "sub": user.email if user.email else user.phone_number, 
            "user_id": user.id, 
            "is_admin": user.is_admin,
            "is_verified_email": user.is_verified_email,
            "is_verified_phone": user.is_verified_phone
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google-login", response_model=schemas.Token)
def google_login(data: schemas.GoogleLogin, db: Session = Depends(database.get_db)):
    try:
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Google Client ID not configured")
            
        idinfo = id_token.verify_oauth2_token(data.id_token, google_requests.Request(), GOOGLE_CLIENT_ID, clock_skew_in_seconds=15)
        
        email = idinfo['email']
        google_id = idinfo['sub']
        full_name = idinfo.get('name')

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            is_admin = email in ADMIN_EMAILS
            user = models.User(
                email=email,
                google_id=google_id,
                full_name=full_name,
                is_admin=is_admin,
                is_verified_email=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.google_id:
            user.google_id = google_id
            user.is_verified_email = True
            db.commit()
            db.refresh(user)

        access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = utils.create_access_token(
            data={
                "sub": user.email, 
                "user_id": user.id, 
                "is_admin": user.is_admin,
                "is_verified_email": user.is_verified_email,
                "is_verified_phone": user.is_verified_phone
            }, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        print(f"GOOGLE AUTH ERROR: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

@router.post("/facebook-login", response_model=schemas.Token)
def facebook_login(data: schemas.FacebookLogin, db: Session = Depends(database.get_db)):
    import requests
    try:
        graph_url = "https://graph.facebook.com/v18.0/me"
        params = {
            "fields": "id,name,email",
            "access_token": data.access_token
        }
        res = requests.get(graph_url, params=params, timeout=5)
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Facebook access token")
            
        fb_data = res.json()
        facebook_id = fb_data.get("id")
        full_name = fb_data.get("name")
        email = fb_data.get("email")
        
        if not facebook_id:
            raise HTTPException(status_code=400, detail="Unable to retrieve Facebook ID")
            
        user = db.query(models.User).filter(models.User.facebook_id == facebook_id).first()
        if not user:
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user:
                    user.facebook_id = facebook_id
                    user.is_verified_email = True
                    db.commit()
                    db.refresh(user)
            
            if not user:
                is_admin = email in ADMIN_EMAILS if email else False
                user = models.User(
                    email=email,
                    facebook_id=facebook_id,
                    full_name=full_name,
                    is_admin=is_admin,
                    is_verified_email=True,
                    is_verified_phone=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
        access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = utils.create_access_token(
            data={
                "sub": user.email if user.email else f"facebook_{user.facebook_id}", 
                "user_id": user.id, 
                "is_admin": user.is_admin,
                "is_verified_email": user.is_verified_email,
                "is_verified_phone": user.is_verified_phone
            }, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"FACEBOOK AUTH ERROR: {e}")
        raise HTTPException(status_code=400, detail=f"Facebook login failed: {str(e)}")

@router.post("/instagram-login", response_model=schemas.Token)
def instagram_login(data: schemas.InstagramLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.instagram_id == data.instagram_id).first()
    if not user:
        user = models.User(
            instagram_id=data.instagram_id,
            full_name=data.full_name,
            is_active=True,
            is_admin=False,
            is_verified_email=True,
            is_verified_phone=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={
            "sub": f"instagram_{user.instagram_id}", 
            "user_id": user.id, 
            "is_admin": user.is_admin,
            "is_verified_email": user.is_verified_email,
            "is_verified_phone": user.is_verified_phone
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/verify/send")
def send_verification(data: schemas.VerificationSend):
    if not data.email and not data.phone_number:
        raise HTTPException(status_code=400, detail="Must provide email or phone number")
    send_verification_logic(email=data.email, phone_number=data.phone_number)
    target = data.email if data.email else data.phone_number
    return {"message": f"Verification code sent to {target}"}

@router.post("/verify/confirm")
def confirm_verification(data: schemas.VerificationConfirm, db: Session = Depends(database.get_db)):
    target = data.email if data.email else data.phone_number
    if not target:
        raise HTTPException(status_code=400, detail="Must provide email or phone number")
        
    entry = verification_codes.get(target)
    if not entry or entry["code"] != data.code or entry["expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    if data.email:
        user = db.query(models.User).filter(models.User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_verified_email = True
    else:
        user = db.query(models.User).filter(models.User.phone_number == data.phone_number).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_verified_phone = True
        
    db.commit()
    del verification_codes[target]
    return {"message": "Verification successful"}

@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()
