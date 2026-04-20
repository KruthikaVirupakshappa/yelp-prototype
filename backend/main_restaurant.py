from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import ensure_indexes
from app.routes import restaurants
from app.config import get_settings

settings = get_settings()

app = FastAPI(title="Restaurant Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(restaurants.router)


@app.on_event("startup")
def startup_event():
    ensure_indexes()


@app.get("/")
def root():
    return {"message": "Restaurant Service is running"}
