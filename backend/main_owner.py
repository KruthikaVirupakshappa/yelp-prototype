from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import ensure_indexes
from app.routes import owner


app = FastAPI(title="Restaurant Owner Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(owner.router)


@app.on_event("startup")
def startup_event():
    ensure_indexes()


@app.get("/")
def root():
    return {"message": "Restaurant Owner Service is running"}
