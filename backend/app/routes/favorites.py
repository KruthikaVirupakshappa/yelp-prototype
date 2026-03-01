from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.favorite import Favorite
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


@router.post("/{restaurant_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.restaurant_id == restaurant_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")

    fav = Favorite(user_id=current_user.id, restaurant_id=restaurant_id)
    db.add(fav)
    db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id, Favorite.restaurant_id == restaurant_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")
    db.delete(fav)
    db.commit()


@router.get("/", response_model=List[RestaurantResponse])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    restaurants = []
    for f in favs:
        r = db.query(Restaurant).filter(Restaurant.id == f.restaurant_id).first()
        if r:
            resp = RestaurantResponse.model_validate(r)
            resp.photos = [p.photo_url for p in r.photos]
            restaurants.append(resp)
    return restaurants