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
    # Basic validation: check if already booked
    existing = db.query(models.RentalBooking).filter(
        models.RentalBooking.product_id == booking.product_id,
        models.RentalBooking.end_date >= booking.start_date,
        models.RentalBooking.start_date <= booking.end_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Product is not available for these dates")

    new_booking = models.RentalBooking(**booking.dict())
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.get("/availability/{product_id}")
def check_availability(product_id: int, db: Session = Depends(database.get_db)):
    bookings = db.query(models.RentalBooking).filter(
        models.RentalBooking.product_id == product_id,
        models.RentalBooking.status == "confirmed"
    ).all()
    
    booked_dates = []
    for booking in bookings:
        for single_date in get_date_range(booking.start_date, booking.end_date):
            booked_dates.append(single_date)
            
    return {"product_id": product_id, "booked_dates": list(set(booked_dates))}

@app.get("/health")
def health_check():
    return {"status": "ok"}
