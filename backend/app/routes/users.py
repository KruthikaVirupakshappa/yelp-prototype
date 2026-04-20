import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.database import get_db
from app.schemas.user import UserResponse, UserProfileUpdate
from app.auth import get_current_user
from app.config import get_settings
from app.kafka_producer import publish

settings = get_settings()
router = APIRouter(prefix="/api/users", tags=["Users"])


def _user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"], name=user["name"], email=user["email"],
        role=user["role"], phone=user.get("phone"),
        about_me=user.get("about_me"), city=user.get("city"),
        state=user.get("state"), country=user.get("country"),
        languages=user.get("languages"), gender=user.get("gender"),
        profile_picture=user.get("profile_picture"),
        restaurant_location=user.get("restaurant_location"),
        created_at=user.get("created_at"),
    )


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return _user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    db["users"].update_one({"id": current_user["id"]}, {"$set": update_data})
    user = db["users"].find_one({"id": current_user["id"]})
    publish("user.updated", {"user_id": current_user["id"], "fields": list(update_data.keys())})
    return _user_to_response(user)


@router.post("/me/profile-picture", response_model=UserResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = file.filename.split(".")[-1]
    filename = f"profile_{current_user['id']}.{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    db["users"].update_one(
        {"id": current_user["id"]},
        {"$set": {"profile_picture": f"/uploads/{filename}", "updated_at": datetime.now(timezone.utc)}},
    )
    user = db["users"].find_one({"id": current_user["id"]})
    return _user_to_response(user)
