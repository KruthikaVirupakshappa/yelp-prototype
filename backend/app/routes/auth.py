from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db, get_next_id
from app.schemas.user import UserSignup, UserLogin, UserResponse, TokenResponse
from app.auth import hash_password, verify_password, create_access_token
from app.kafka_producer import publish

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


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


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserSignup, db=Depends(get_db)):
    if db["users"].find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = get_next_id("users")
    now = datetime.now(timezone.utc)
    user = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "restaurant_location": data.restaurant_location,
        "created_at": now,
        "updated_at": now,
    }
    db["users"].insert_one(user)

    # Store session in MongoDB (Part 3 requirement)
    token = create_access_token(data={"sub": str(user_id)})
    db["sessions"].insert_one({
        "user_id": user_id,
        "token": token,
        "created_at": now,
    })

    db["activity_logs"].insert_one({
        "user_id": user_id, "action": "signup", "created_at": now
    })
    publish("user.created", {"user_id": user_id, "name": data.name, "email": data.email, "role": data.role})

    return TokenResponse(access_token=token, user=_user_to_response(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db=Depends(get_db)):
    user = db["users"].find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    now = datetime.now(timezone.utc)
    token = create_access_token(data={"sub": str(user["id"])})

    # Upsert session
    db["sessions"].update_one(
        {"user_id": user["id"]},
        {"$set": {"token": token, "updated_at": now}},
        upsert=True,
    )
    db["activity_logs"].insert_one({
        "user_id": user["id"], "action": "login", "created_at": now
    })

    return TokenResponse(access_token=token, user=_user_to_response(user))
