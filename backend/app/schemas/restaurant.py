from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RestaurantCreate(BaseModel):
    name: str
    cuisine_type: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    hours_of_operation: Optional[str] = None
    pricing_tier: Optional[str] = None
    amenities: Optional[str] = None


class RestaurantUpdate(RestaurantCreate):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None


class RestaurantResponse(BaseModel):
    id: int
    name: str
    cuisine_type: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    hours_of_operation: Optional[str] = None
    pricing_tier: Optional[str] = None
    amenities: Optional[str] = None
    average_rating: float = 0.0
    review_count: int = 0
    owner_id: Optional[int] = None
    created_by: int
    created_at: Optional[datetime] = None
    photos: Optional[List[str]] = []
