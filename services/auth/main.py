import os
from fastapi import FastAPI, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from fastapi.middleware.cors import CORSMiddleware
import random
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

import models, schemas, utils, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin Emails Allowlist (User should provide these)
ADMIN_EMAILS = ["admin@example.com", "harsh@example.com", "harshranjan1221@gmail.com", "connect.local.1221@gmail.com"]

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

@app.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(user.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")

    is_admin = user.email in ADMIN_EMAILS
    hashed_password = utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        full_name=user.full_name,
        is_admin=is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Trigger Verification Code
    send_verification_logic(new_user.email)
    
    return new_user

def send_verification_logic(email: str):
    code = f"{random.randint(100000, 999999)}"
    verification_codes[email] = {"code": code, "expires": datetime.utcnow() + timedelta(minutes=10)}
    
    # MOCK: Still print to terminal in case SMTP fails or is not configured
    print(f"VERIFICATION CODE FOR {email}: {code}")
    
    # Optional: Actual email sending background task could be here
    # but for simplicity in this flow, we print it. 
    # If MAIL_USERNAME is configured, we could attempt to send.

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Sync admin status during login
    is_admin = user.email in ADMIN_EMAILS
    if is_admin != user.is_admin:
        user.is_admin = is_admin
        db.commit()
        db.refresh(user)
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={
            "sub": user.email, 
            "user_id": user.id, 
            "is_admin": user.is_admin,
            "is_verified_email": user.is_verified_email
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# In-memory store for verification codes (Dev only)
verification_codes = {}

@app.post("/google-login", response_model=schemas.Token)
def google_login(data: schemas.GoogleLogin, db: Session = Depends(database.get_db)):
    try:
        # Verify the ID token
        # Client ID should be provided by environment variable
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not GOOGLE_CLIENT_ID:
            # Fallback for dev if not set, but practically we need it
            raise HTTPException(status_code=500, detail="Google Client ID not configured")
            
        idinfo = id_token.verify_oauth2_token(data.id_token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email']
        google_id = idinfo['sub']
        full_name = idinfo.get('name')

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            # Create new user
            is_admin = email in ADMIN_EMAILS
            user = models.User(
                email=email,
                google_id=google_id,
                full_name=full_name,
                is_admin=is_admin,
                is_verified_email=True # Google emails are pre-verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.google_id:
            # Link google account to existing email
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
                "is_verified_email": user.is_verified_email
            }, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

@app.post("/verify/send")
def send_verification(data: schemas.VerificationSend):
    send_verification_logic(data.email)
    return {"message": "Verification code sent to email"}

@app.post("/verify/confirm")
def confirm_verification(data: schemas.VerificationConfirm, db: Session = Depends(database.get_db)):
    entry = verification_codes.get(data.email)
    if not entry or entry["code"] != data.code or entry["expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified_email = True
    db.commit()
    del verification_codes[data.email]
    return {"message": "Verification successful"}

@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@app.get("/health")
def health_check():
    return {"status": "ok"}
