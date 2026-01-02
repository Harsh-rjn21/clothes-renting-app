from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, date
from fastapi.middleware.cors import CORSMiddleware

import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Rental Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_date_range(start: date, end: date):
    delta = end - start
    for i in range(delta.days + 1):
        yield start + timedelta(days=i)

@app.post("/bookings", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(database.get_db)):
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
    return new_booking

@app.post("/blocks", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
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

@app.get("/availability/{product_id}")
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


@app.get("/health")
def health_check():
    return {"status": "ok"}
