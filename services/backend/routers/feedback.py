from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
import sys

# Ensure parent directory is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import database
import models
import schemas
import utils

router = APIRouter()
security = HTTPBearer()

def get_user_claims(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        user_id: int = payload.get("user_id")
        is_admin: bool = payload.get("is_admin", False)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token claims")
        return {"user_id": user_id, "is_admin": is_admin}
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@router.post("/reviews", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: schemas.ReviewCreate, 
    db: Session = Depends(database.get_db),
    claims: dict = Depends(get_user_claims)
):
    if claims["user_id"] != review.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to post review as another user")
        
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

@router.patch("/reviews/{review_id}", response_model=schemas.ReviewResponse)
def update_review(
    review_id: int, 
    review_update: schemas.ReviewUpdate, 
    db: Session = Depends(database.get_db),
    claims: dict = Depends(get_user_claims)
):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if not claims["is_admin"] and db_review.user_id != claims["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this review")
    
    if review_update.comment is not None:
        db_review.comment = review_update.comment
    if review_update.rating is not None:
        if review_update.rating < 1 or review_update.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        db_review.rating = review_update.rating
        
    db.commit()
    db.refresh(db_review)
    return db_review

@router.post("/reviews/{review_id}/revert", response_model=schemas.ReviewResponse)
def revert_review(
    review_id: int, 
    db: Session = Depends(database.get_db),
    claims: dict = Depends(get_user_claims)
):
    if not claims["is_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can revert reviews")
        
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db_review.comment = db_review.original_comment
    db_review.rating = db_review.original_rating
    db.commit()
    db.refresh(db_review)
    return db_review

@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int, 
    db: Session = Depends(database.get_db),
    claims: dict = Depends(get_user_claims)
):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if not claims["is_admin"] and db_review.user_id != claims["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    db.delete(db_review)
    db.commit()
    return None

@router.get("/reviews", response_model=List[schemas.ReviewResponse])
def get_all_reviews(db: Session = Depends(database.get_db)):
    return db.query(models.Review).all()

@router.get("/reviews/{product_id}", response_model=List[schemas.ReviewResponse])
def get_reviews(product_id: int, db: Session = Depends(database.get_db)):
    reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    return reviews
