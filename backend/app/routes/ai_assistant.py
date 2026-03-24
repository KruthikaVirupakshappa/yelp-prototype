from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Literal, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from jose import JWTError, jwt

from app.database import get_db
from app.models.restaurant import Restaurant
from app.models.user_preferences import UserPreferences
from app.models.user import User
from app.config import get_settings

settings = get_settings()
_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_optional_user(
    token: Optional[str] = Depends(_oauth2),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        return db.query(User).filter(User.id == int(sub)).first()
    except JWTError:
        return None

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
    pricing_tier: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    conversation_history: List[ChatMessage]
    recommendations: List[RestaurantRec] = []
    source: str = "template"  # "llm" or "template"


def _build_filters_from_query(db: Session, q_lower: str) -> dict:
    """Extract intent filters from query text using DB values where possible."""
    filters = {}

    # Cuisine detection — fetch distinct values from DB
    db_cuisines = [
        row[0].lower() for row in db.query(Restaurant.cuisine_type).distinct().all()
        if row[0]
    ]
    for c in db_cuisines:
        if c in q_lower:
            filters["cuisine"] = c
            break

    # Price detection
    if any(w in q_lower for w in ["cheap", "budget", "affordable", "inexpensive"]):
        filters["price"] = "$"
    elif any(w in q_lower for w in ["moderate", "mid-range", "mid range"]):
        filters["price"] = "$$"
    elif any(w in q_lower for w in ["upscale", "fine dining", "fancy", "expensive", "high-end"]):
        filters["price"] = "$$$"

    # City detection — fetch distinct values from DB
    db_cities = [
        row[0].lower() for row in db.query(Restaurant.city).distinct().all()
        if row[0]
    ]
    for city in db_cities:
        if city in q_lower:
            filters["city"] = city
            break

    # Ambiance / occasion keywords
    ambiance_keywords = ["romantic", "casual", "family", "outdoor", "cozy", "quiet",
                         "date", "anniversary", "birthday", "brunch", "dinner", "lunch"]
    found_ambiance = [k for k in ambiance_keywords if k in q_lower]
    if found_ambiance:
        filters["ambiance"] = found_ambiance

    # Dietary
    dietary_keywords = ["vegan", "vegetarian", "halal", "gluten-free", "kosher", "dairy-free"]
    found_dietary = [k for k in dietary_keywords if k in q_lower]
    if found_dietary:
        filters["dietary"] = found_dietary

    return filters


def _query_restaurants(db: Session, q_lower: str, prefs: Optional[UserPreferences],
                        filters: dict, limit: int = 5) -> List[Restaurant]:
    query = db.query(Restaurant)

    # Apply cuisine filter from query or preferences
    cuisine = filters.get("cuisine")
    if not cuisine and prefs and prefs.cuisine_preferences:
        cuisine = prefs.cuisine_preferences.split(",")[0].strip().lower()
    if cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))

    # Apply price filter from query or preferences
    price = filters.get("price")
    if not price and prefs and prefs.price_range:
        price = prefs.price_range
    if price:
        query = query.filter(Restaurant.pricing_tier == price)

    # Apply city filter from query
    city = filters.get("city")
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))

    # Apply keyword search across description and amenities
    dietary = filters.get("dietary", [])
    ambiance = filters.get("ambiance", [])
    extra_keywords = dietary + ambiance
    if extra_keywords:
        kw_filters = []
        for kw in extra_keywords:
            kw_filters.append(Restaurant.description.ilike(f"%{kw}%"))
            kw_filters.append(Restaurant.amenities.ilike(f"%{kw}%"))
        query = query.filter(or_(*kw_filters))

    # Sort by rating descending
    query = query.order_by(Restaurant.average_rating.desc())
    results = query.limit(limit).all()

    # Fallback: broad keyword search (no city/cuisine relaxation — stay relevant)
    if not results and q_lower:
        results = (
            db.query(Restaurant)
            .filter(or_(
                Restaurant.name.ilike(f"%{q_lower}%"),
                Restaurant.cuisine_type.ilike(f"%{q_lower}%"),
                Restaurant.city.ilike(f"%{q_lower}%"),
                Restaurant.description.ilike(f"%{q_lower}%"),
            ))
            .order_by(Restaurant.average_rating.desc())
            .limit(limit)
            .all()
        )

    return results



def _format_rec(r: Restaurant) -> RestaurantRec:
    return RestaurantRec(
        id=r.id,
        name=r.name,
        cuisine_type=r.cuisine_type,
        average_rating=float(r.average_rating or 0.0),
        pricing_tier=r.pricing_tier,
        city=r.city,
        description=r.description,
    )


def _build_reply_with_llm(
    message: str,
    history: List[ChatMessage],
    recommendations: List[Restaurant],
    prefs: Optional[UserPreferences],
    filters: dict,
) -> tuple[str, str]:
    """Use LangChain with local Ollama. Returns (reply, source) where source is 'llm' or 'template'."""
    try:
        from langchain_ollama import ChatOllama
        from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            temperature=0.7,
            base_url=settings.OLLAMA_BASE_URL,
        )

        pref_summary = ""
        if prefs:
            parts = []
            if prefs.cuisine_preferences:
                parts.append(f"Cuisine preferences: {prefs.cuisine_preferences}")
            if prefs.price_range:
                parts.append(f"Price range: {prefs.price_range}")
            if prefs.dietary_needs:
                parts.append(f"Dietary needs: {prefs.dietary_needs}")
            if prefs.ambiance_preferences:
                parts.append(f"Ambiance preferences: {prefs.ambiance_preferences}")
            if prefs.preferred_location:
                parts.append(f"Preferred location: {prefs.preferred_location}")
            if prefs.sort_preference:
                parts.append(f"Sort preference: {prefs.sort_preference}")
            pref_summary = ". ".join(parts)

        rec_summary = ""
        if recommendations:
            rec_blocks = []
            for i, r in enumerate(recommendations[:5], 1):
                rating = float(r.average_rating or 0)
                lines = [
                    f"{i}. {r.name} | Link: /restaurants/{r.id}",
                    f"   Cuisine: {r.cuisine_type or 'N/A'} | Price: {r.pricing_tier or 'N/A'} | Rating: ★{rating:.1f} ({r.review_count} reviews) | City: {r.city or 'N/A'}",
                ]
                if r.description:
                    lines.append(f"   Description: {r.description}")
                if r.amenities:
                    lines.append(f"   Amenities: {r.amenities}")
                if r.hours_of_operation:
                    lines.append(f"   Hours: {r.hours_of_operation}")
                if r.reviews:
                    lines.append(f"   Customer Reviews ({len(r.reviews)}):")
                    for rev in r.reviews:
                        lines.append(f"     - ★{rev.rating}: \"{rev.comment}\"")
                rec_blocks.append("\n".join(lines))
            rec_summary = "\n\n".join(rec_blocks)

        system_content = (
            "You are a friendly restaurant recommendation assistant for a Yelp-like platform. "
            "Help users discover great restaurants. Be conversational, helpful, and concise.\n"
            "FORMATTING RULES:\n"
            "1. You must ONLY mention restaurants that appear in the list below — use their EXACT names as written.\n"
            "2. Do NOT invent, rename, or substitute any restaurant not in the list.\n"
            "3. Always bold restaurant names using **Name** markdown.\n"
            "4. Highlight key details the user specifically asked about — e.g. if they asked about San Jose, "
            "bold or emphasize 'San Jose' in your response. Do the same for cuisine type, price range, ambiance, etc.\n"
            "5. Do NOT include any URLs or paths like /restaurants/1 in your response.\n"
        )
        if pref_summary:
            system_content += f"\nUser preferences: {pref_summary}\n"
        if rec_summary:
            system_content += f"\nRestaurants available in our database (recommend ONLY from this list):\n{rec_summary}\n"
        else:
            system_content += "\nNo matching restaurants were found in our database for this query.\n"
        system_content += (
            "\nBased on the user's query and the customer reviews above, recommend only from the restaurants listed. "
            "Reference specific reviews when relevant. Bold restaurant names. "
            "If none match, say so — do not suggest restaurants outside this list."
        )

        msgs = [SystemMessage(content=system_content)]
        for m in history[:-1]:
            if m.role == "user":
                msgs.append(HumanMessage(content=m.content))
            else:
                msgs.append(AIMessage(content=m.content))
        msgs.append(HumanMessage(content=message))

        response = llm.invoke(msgs)
        return response.content, "llm"

    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Ollama LLM failed, using template: {e}")
        return _build_template_reply(message, recommendations, prefs, filters), "template"


def _build_template_reply(  # noqa: D401
    _message: str,
    recommendations: List[Restaurant],
    prefs: Optional[UserPreferences],
    filters: dict,
) -> str:
    """Build a structured template reply without LLM."""
    if not recommendations:
        return (
            "I couldn't find any restaurants matching your request. "
            "Try a different cuisine, location, or search term."
        )

    # Build context hint
    context_parts = []
    if filters.get("cuisine"):
        context_parts.append(filters["cuisine"])
    if filters.get("ambiance"):
        context_parts.append(", ".join(filters["ambiance"]))
    if filters.get("dietary"):
        context_parts.append(", ".join(filters["dietary"]))
    if prefs and prefs.cuisine_preferences and not filters.get("cuisine"):
        context_parts.append(f"your {prefs.cuisine_preferences} preference")

    intro = f"Based on your request" + (f" for {', '.join(context_parts)}" if context_parts else "") + ", here are my recommendations:\n\n"

    lines = []
    for i, r in enumerate(recommendations[:5], 1):
        rating = float(r.average_rating or 0)
        price = r.pricing_tier or ""
        city = r.city or ""
        cuisine = r.cuisine_type or ""
        line = f"{i}. **{r.name}** (★{rating:.1f}"
        if price:
            line += f", {price}"
        if cuisine:
            line += f", {cuisine}"
        if city:
            line += f", {city}"
        line += ")"
        if r.description:
            line += f" — {r.description[:100]}"
        lines.append(line)

    return intro + "\n".join(lines)



@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    history = list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    q = (req.message or "").strip()
    q_lower = q.lower()

    # Load user preferences
    prefs = None
    if current_user:
        prefs = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()

    # Extract intent filters from query
    filters = _build_filters_from_query(db, q_lower)

    # Query restaurant database
    matches = _query_restaurants(db, q_lower, prefs, filters)

    # Build recommendations list
    recommendations = [_format_rec(r) for r in matches]

    reply, source = _build_reply_with_llm(q, history, matches, prefs, filters)

    history.append(ChatMessage(role="assistant", content=reply))

    return ChatResponse(
        reply=reply,
        conversation_history=history,
        recommendations=recommendations,
        source=source,
    )


@router.post("/chat/anonymous", response_model=ChatResponse)
def chat_anonymous(req: ChatRequest, db: Session = Depends(get_db)):
    """Chat endpoint for unauthenticated users (no preferences loaded)."""
    history = list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    q = (req.message or "").strip()
    q_lower = q.lower()

    filters = _build_filters_from_query(db, q_lower)
    matches = _query_restaurants(db, q_lower, None, filters)
    recommendations = [_format_rec(r) for r in matches]
    reply = _build_template_reply(q, matches, None, filters)

    history.append(ChatMessage(role="assistant", content=reply))

    return ChatResponse(
        reply=reply,
        conversation_history=history,
        recommendations=recommendations,
        source="template",
    )
