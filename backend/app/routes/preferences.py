from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.schemas.preferences import PreferencesUpdate, PreferencesResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/preferences", tags=["Preferences"])


@router.get("/", response_model=PreferencesResponse)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return PreferencesResponse.model_validate(prefs)


@router.put("/", response_model=PreferencesResponse)
def update_preferences(
    data: PreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prefs, key, value)
    db.commit()
    db.refresh(prefs)
    return PreferencesResponse.model_validate(prefs)