from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.review import Review
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


def _update_restaurant_stats(db: Session, restaurant_id: int):
    stats = db.query(
        func.avg(Review.rating).label("avg"),
        func.count(Review.id).label("cnt"),
    ).filter(Review.restaurant_id == restaurant_id).first()

    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if restaurant:
        restaurant.average_rating = round(float(stats.avg or 0), 2)
        restaurant.review_count = stats.cnt or 0
        db.commit()


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == data.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    existing = db.query(Review).filter(
        Review.user_id == current_user.id, Review.restaurant_id == data.restaurant_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this restaurant")

    review = Review(user_id=current_user.id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    _update_restaurant_stats(db, data.restaurant_id)

    resp = ReviewResponse.model_validate(review)
    resp.user_name = current_user.name
    return resp


@router.get("/restaurant/{restaurant_id}", response_model=List[ReviewResponse])
def get_restaurant_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        resp = ReviewResponse.model_validate(r)
        resp.user_name = r.user.name if r.user else None
        result.append(resp)
    return result


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(review, key, value)
    db.commit()
    db.refresh(review)
    _update_restaurant_stats(db, review.restaurant_id)

    resp = ReviewResponse.model_validate(review)
    resp.user_name = current_user.name
    return resp


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    restaurant_id = review.restaurant_id
    db.delete(review)
    db.commit()
    _update_restaurant_stats(db, restaurant_id)


@router.get("/user/history", response_model=List[ReviewResponse])
def get_user_review_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        resp = ReviewResponse.model_validate(r)
        resp.user_name = current_user.name
        result.append(resp)
    return result