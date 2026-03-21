from pydantic import BaseModel
from typing import Optional


class PreferencesUpdate(BaseModel):
    cuisine_preferences: Optional[str] = None
    price_range: Optional[str] = None
    dietary_needs: Optional[str] = None
    preferred_location: Optional[str] = None
    ambiance_preferences: Optional[str] = None
    sort_preference: Optional[str] = None


class PreferencesResponse(BaseModel):
    id: int
    user_id: int
    cuisine_preferences: Optional[str] = None
    price_range: Optional[str] = None
    dietary_needs: Optional[str] = None
    preferred_location: Optional[str] = None
    ambiance_preferences: Optional[str] = None
    sort_preference: Optional[str] = None

    class Config:
        from_attributes = True