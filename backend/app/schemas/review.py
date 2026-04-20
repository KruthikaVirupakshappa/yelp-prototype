from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    restaurant_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class ReplyCreate(BaseModel):
    reply: str


class VoteCreate(BaseModel):
    vote: Literal["helpful", "unhelpful"]


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    rating: int
    comment: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_name: Optional[str] = None
    owner_reply: Optional[str] = None
    owner_reply_at: Optional[datetime] = None
    helpful_votes: int = 0
    unhelpful_votes: int = 0
