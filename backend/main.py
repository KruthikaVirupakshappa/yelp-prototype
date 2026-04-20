from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import ensure_indexes
from app.routes import auth, users, restaurants, reviews, favorites, preferences, owner, ai_assistant
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Yelp Prototype API",
    description="A Yelp-style restaurant discovery and review platform API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(reviews.router)
app.include_router(favorites.router)
app.include_router(preferences.router)
app.include_router(ai_assistant.router)
app.include_router(owner.router)


@app.on_event("startup")
def startup_event():
    ensure_indexes()


@app.get("/")
def root():
    return {"message": "Yelp Prototype API v2 (MongoDB) is running", "docs": "/docs"}
