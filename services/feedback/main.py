from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware

import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Feedback Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/reviews", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(database.get_db)):
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if user already reviewed this product
    existing = db.query(models.Review).filter(
        models.Review.user_id == review.user_id,
        models.Review.product_id == review.product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
        
    new_review = models.Review(
        **review.dict(), 
        original_comment=review.comment,
        original_rating=review.rating
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@app.patch("/reviews/{review_id}", response_model=schemas.ReviewResponse)
def update_review(review_id: int, review_update: schemas.ReviewUpdate, db: Session = Depends(database.get_db)):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review_update.comment is not None:
        db_review.comment = review_update.comment
    if review_update.rating is not None:
        if review_update.rating < 1 or review_update.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        db_review.rating = review_update.rating
        
    db.commit()
    db.refresh(db_review)
    return db_review

@app.post("/reviews/{review_id}/revert", response_model=schemas.ReviewResponse)
def revert_review(review_id: int, db: Session = Depends(database.get_db)):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db_review.comment = db_review.original_comment
    db_review.rating = db_review.original_rating
    db.commit()
    db.refresh(db_review)
    return db_review

@app.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(database.get_db)):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db.delete(db_review)
    db.commit()
    return None

@app.get("/reviews", response_model=List[schemas.ReviewResponse])
def get_all_reviews(db: Session = Depends(database.get_db)):
    return db.query(models.Review).all()

@app.get("/reviews/{product_id}", response_model=List[schemas.ReviewResponse])
def get_reviews(product_id: int, db: Session = Depends(database.get_db)):
    reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    return reviews

@app.get("/health")
def health_check():
    return {"status": "ok"}
