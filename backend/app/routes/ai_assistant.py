from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Literal, Optional

from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Restaurant  

router = APIRouter(prefix="/api/ai-assistant", tags=["AI Assistant"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class RestaurantRec(BaseModel):
    id: int
    name: str
    cuisine_type: Optional[str] = None
    average_rating: Optional[float] = 0.0


class ChatResponse(BaseModel):
    reply: str
    conversation_history: List[ChatMessage]
    recommendations: List[RestaurantRec] = []


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    history = list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    q = (req.message or "").strip()
    q_lower = q.lower()

    query = db.query(Restaurant)

    if q_lower:
        query = query.filter(
            (Restaurant.name.ilike(f"%{q_lower}%")) |
            (Restaurant.cuisine_type.ilike(f"%{q_lower}%")) |
            (Restaurant.city.ilike(f"%{q_lower}%"))
        )

    matches = query.limit(5).all()

    if not matches:
        matches = db.query(Restaurant).limit(5).all()

    recommendations = [
        RestaurantRec(
            id=r.id,
            name=r.name,
            cuisine_type=getattr(r, "cuisine_type", None),
            average_rating=float(getattr(r, "average_rating", 0.0) or 0.0),
        )
        for r in matches
    ]

    reply = f"I found {len(recommendations)} places for: '{q}'."

    history.append(ChatMessage(role="assistant", content=reply))

    return {
        "reply": reply,
        "conversation_history": history,
        "recommendations": recommendations,
    }