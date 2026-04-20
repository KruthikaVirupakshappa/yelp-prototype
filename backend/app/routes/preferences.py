from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.database import get_db, get_next_id
from app.schemas.preferences import PreferencesUpdate, PreferencesResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/preferences", tags=["Preferences"])


def _to_response(p: dict) -> PreferencesResponse:
    return PreferencesResponse(
        id=p["id"], user_id=p["user_id"],
        cuisine_preferences=p.get("cuisine_preferences"),
        price_range=p.get("price_range"),
        dietary_needs=p.get("dietary_needs"),
        preferred_location=p.get("preferred_location"),
        ambiance_preferences=p.get("ambiance_preferences"),
        sort_preference=p.get("sort_preference"),
    )


def _get_or_create(db, user_id: int) -> dict:
    prefs = db["preferences"].find_one({"user_id": user_id})
    if not prefs:
        prefs = {"id": get_next_id("preferences"), "user_id": user_id,
                 "created_at": datetime.now(timezone.utc)}
        db["preferences"].insert_one(prefs)
    return prefs


@router.get("/", response_model=PreferencesResponse)
def get_preferences(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    return _to_response(_get_or_create(db, current_user["id"]))


@router.put("/", response_model=PreferencesResponse)
def update_preferences(
    data: PreferencesUpdate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _get_or_create(db, current_user["id"])
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now(timezone.utc)
    db["preferences"].update_one({"user_id": current_user["id"]}, {"$set": update_data})
    return _to_response(db["preferences"].find_one({"user_id": current_user["id"]}))
