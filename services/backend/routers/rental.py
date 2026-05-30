from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, date
import os
import sys
import razorpay

# Ensure parent directory is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import database
import models
import schemas

router = APIRouter()

# Load root .env file variables dynamically
def load_env():
    root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
    if os.path.exists(root_env):
        with open(root_env) as f:
            for line in f:
                if line.strip() and not line.strip().startswith('#') and '=' in line:
                    key, val = line.strip().split('=', 1)
                    os.environ[key.strip()] = val.strip()

load_env()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def get_date_range(start: date, end: date):
    delta = end - start
    for i in range(delta.days + 1):
        yield start + timedelta(days=i)

@router.post("/bookings", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(database.get_db)):
    if booking.type == "rent":
        if not booking.start_date or not booking.end_date:
            raise HTTPException(status_code=400, detail="Start date and end date are required for rentals")
            
        # Check if already booked OR blocked
        existing = db.query(models.RentalBooking).filter(
            models.RentalBooking.product_id == booking.product_id,
            models.RentalBooking.end_date >= booking.start_date,
            models.RentalBooking.start_date <= booking.end_date,
            models.RentalBooking.status == "confirmed"
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail=f"Item is already booked or blocked from {existing.start_date} to {existing.end_date}")

    new_booking = models.RentalBooking(**booking.dict())
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    # Trigger notifications
    if new_booking.type == "rent":
        duration = (new_booking.end_date - new_booking.start_date).days + 1
        # Customer notification
        print(f"\n[NOTIFICATION] Sending WhatsApp/Email to Customer (User ID: {new_booking.user_id}):")
        print(f"  Message: Hello! Your booking for Product ID {new_booking.product_id} has been confirmed from {new_booking.start_date} to {new_booking.end_date} ({duration} days).")
        # Admin notification
        print(f"\n[NOTIFICATION] Sending WhatsApp/Email targeting phone 916206430920 and sender connect.local.1221@gmail.com")
        print(f"  Message: Admin Alert: Customer ID {new_booking.user_id} has booked Product ID {new_booking.product_id} to rent from {new_booking.start_date} to {new_booking.end_date} for {duration} days.")
        print("="*60 + "\n")
    else:
        # Customer notification
        print(f"\n[NOTIFICATION] Sending WhatsApp/Email to Customer (User ID: {new_booking.user_id}):")
        print(f"  Message: Hello! Your order for Product ID {new_booking.product_id} has been confirmed. Thank you for your purchase!")
        # Admin notification
        print(f"\n[NOTIFICATION] Sending WhatsApp/Email targeting phone 916206430920 and sender connect.local.1221@gmail.com")
        print(f"  Message: Admin Alert: Customer ID {new_booking.user_id} has purchased Product ID {new_booking.product_id} to buy.")
        print("="*60 + "\n")
        
    return new_booking

@router.post("/blocks", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def create_block(block: schemas.BlockCreate, db: Session = Depends(database.get_db)):
    new_block = models.RentalBooking(
        product_id=block.product_id,
        start_date=block.start_date,
        end_date=block.end_date,
        user_id=0, # 0 indicates system/admin block
        is_block=True
    )
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

@router.get("/availability/{product_id}")
def check_availability(product_id: int, db: Session = Depends(database.get_db)):
    # Include both confirmed regular bookings and admin blocks
    bookings = db.query(models.RentalBooking).filter(
        models.RentalBooking.product_id == product_id,
        models.RentalBooking.status == "confirmed"
    ).all()
    
    booked_dates = []
    for booking in bookings:
        for single_date in get_date_range(booking.start_date, booking.end_date):
            booked_dates.append(single_date)
            
    # Sort and remove duplicates
    unique_dates = sorted(list(set(booked_dates)))
            
    return {
        "product_id": product_id, 
        "booked_dates": unique_dates,
        "count": len(unique_dates)
    }

@router.post("/measurements", response_model=schemas.MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(measurement: schemas.MeasurementCreate, db: Session = Depends(database.get_db)):
    new_meas = models.Measurement(**measurement.dict())
    db.add(new_meas)
    db.commit()
    db.refresh(new_meas)
    return new_meas

@router.get("/measurements/booking/{booking_id}", response_model=List[schemas.MeasurementResponse])
def get_measurements_by_booking(booking_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Measurement).filter(models.Measurement.booking_id == booking_id).all()

@router.get("/measurements/user/{user_id}", response_model=List[schemas.MeasurementResponse])
def get_measurements_by_user(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Measurement).filter(models.Measurement.user_id == user_id).all()

@router.post("/bookings/razorpay-order", response_model=schemas.RazorpayOrderResponse)
def create_razorpay_order(data: schemas.RazorpayOrderRequest):
    try:
        # Convert amount to paise (INR)
        amount_paise = int(data.amount * 100)
        
        # Generate order
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1
        }
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except Exception as e:
        print(f"RAZORPAY ORDER CREATION ERROR: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create Razorpay Order: {str(e)}")

@router.post("/bookings/verify-payment")
def verify_payment(data: schemas.RazorpayVerificationRequest, db: Session = Depends(database.get_db)):
    try:
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
    except Exception as e:
        print(f"RAZORPAY SIGNATURE VERIFICATION FAILED: {e}")
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Process and commit the bookings and measurements
    created_bookings = []
    try:
        for item in data.items:
            # Check availability if it is a rental
            if item.type == "rent":
                if not item.start_date or not item.end_date:
                    raise HTTPException(status_code=400, detail="Start date and end date are required for rentals")
                    
                existing = db.query(models.RentalBooking).filter(
                    models.RentalBooking.product_id == item.product_id,
                    models.RentalBooking.end_date >= item.start_date,
                    models.RentalBooking.start_date <= item.end_date,
                    models.RentalBooking.status == "confirmed"
                ).first()
                if existing:
                    raise HTTPException(status_code=400, detail=f"Item {item.product_id} is already booked or blocked from {existing.start_date} to {existing.end_date}")

            new_booking = models.RentalBooking(
                product_id=item.product_id,
                user_id=data.user_id,
                start_date=item.start_date,
                end_date=item.end_date,
                status="confirmed",
                type=item.type
            )
            db.add(new_booking)
            db.commit()
            db.refresh(new_booking)
            created_bookings.append(new_booking)
            
            # Save measurements if it is a rental
            if item.type == "rent" and any(v is not None for v in [item.armhole, item.chest, item.waist, item.sleeves, item.length]):
                new_meas = models.Measurement(
                    product_id=item.product_id,
                    user_id=data.user_id,
                    booking_id=new_booking.id,
                    armhole=item.armhole or 0.0,
                    chest=item.chest or 0.0,
                    waist=item.waist or 0.0,
                    sleeves=item.sleeves or 0.0,
                    length=item.length or 0.0
                )
                db.add(new_meas)
                db.commit()

            # Trigger notifications
            if new_booking.type == "rent":
                duration = (new_booking.end_date - new_booking.start_date).days + 1
                # Customer notification
                print(f"\n[NOTIFICATION] Sending WhatsApp/Email to Customer (User ID: {new_booking.user_id}):")
                print(f"  Message: Hello! Your booking for Product ID {new_booking.product_id} has been confirmed from {new_booking.start_date} to {new_booking.end_date} ({duration} days).")
                # Admin notification
                print(f"\n[NOTIFICATION] Sending WhatsApp/Email targeting phone 916206430920 and sender connect.local.1221@gmail.com")
                print(f"  Message: Admin Alert: Customer ID {new_booking.user_id} has booked Product ID {new_booking.product_id} to rent from {new_booking.start_date} to {new_booking.end_date} for {duration} days.")
                print("="*60 + "\n")
            else:
                # Customer notification
                print(f"\n[NOTIFICATION] Sending WhatsApp/Email to Customer (User ID: {new_booking.user_id}):")
                print(f"  Message: Hello! Your order for Product ID {new_booking.product_id} has been confirmed. Thank you for your purchase!")
                # Admin notification
                print(f"\n[NOTIFICATION] Sending WhatsApp/Email targeting phone 916206430920 and sender connect.local.1221@gmail.com")
                print(f"  Message: Admin Alert: Customer ID {new_booking.user_id} has purchased Product ID {new_booking.product_id} to buy.")
                print("="*60 + "\n")

    except Exception as e:
        print(f"BOOKING COMMIT ERROR: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"status": "success", "message": "Payment verified and bookings finalized", "booking_count": len(created_bookings)}
