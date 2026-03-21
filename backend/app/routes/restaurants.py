from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.restaurant_photos import RestaurantPhoto
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/restaurants", tags=["Restaurants"])


def _to_response(r: Restaurant) -> RestaurantResponse:
    resp = RestaurantResponse.model_validate(r)
    resp.photos = [p.photo_url for p in r.photos]
    return resp


@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    data: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    restaurant = Restaurant(**data.model_dump(), created_by=current_user.id)
    if current_user.role == "owner":
        restaurant.owner_id = current_user.id
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return _to_response(restaurant)


@router.get("/", response_model=List[RestaurantResponse])
def search_restaurants(
    name: Optional[str] = Query(None),
    cuisine_type: Optional[str] = Query(None),
    keywords: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    zip_code: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant)

    if name:
        query = query.filter(Restaurant.name.ilike(f"%{name}%"))
    if cuisine_type:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine_type}%"))
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    if zip_code:
        query = query.filter(Restaurant.zip_code == zip_code)
    if keywords:
        kw = f"%{keywords}%"
        query = query.filter(
            or_(
                Restaurant.name.ilike(kw),
                Restaurant.cuisine_type.ilike(kw),
                Restaurant.city.ilike(kw),
                Restaurant.description.ilike(kw),
                Restaurant.amenities.ilike(kw),
            )
        )

    offset = (page - 1) * limit
    restaurants = query.offset(offset).limit(limit).all()
    return [_to_response(r) for r in restaurants]


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return _to_response(restaurant)


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: int,
    data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.owner_id != current_user.id and restaurant.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(restaurant, key, value)
    db.commit()
    db.refresh(restaurant)
    return _to_response(restaurant)


@router.post("/{restaurant_id}/claim", response_model=RestaurantResponse)
def claim_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can claim restaurants")
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.owner_id:
        raise HTTPException(status_code=400, detail="Restaurant already claimed")

    restaurant.owner_id = current_user.id
    db.commit()
    db.refresh(restaurant)
    return _to_response(restaurant)