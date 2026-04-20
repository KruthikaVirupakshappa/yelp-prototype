from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Literal, Optional
from jose import JWTError, jwt

from app.database import get_db
from app.config import get_settings

settings = get_settings()
_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

router = APIRouter(prefix="/api/ai-assistant", tags=["AI Assistant"])


def get_optional_user(token: Optional[str] = Depends(_oauth2), db=Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        return db["users"].find_one({"id": int(sub)})
    except JWTError:
        return None


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
    source: str = "template"


def _build_filters_from_query(db, q_lower: str) -> dict:
    filters = {}

    db_cuisines = [r["cuisine_type"].lower() for r in db["restaurants"].find({}, {"cuisine_type": 1}) if r.get("cuisine_type")]
    for c in set(db_cuisines):
        if c in q_lower:
            filters["cuisine"] = c
            break

    if any(w in q_lower for w in ["cheap", "budget", "affordable", "inexpensive"]):
        filters["price"] = "$"
    elif any(w in q_lower for w in ["moderate", "mid-range", "mid range"]):
        filters["price"] = "$$"
    elif any(w in q_lower for w in ["upscale", "fine dining", "fancy", "expensive", "high-end"]):
        filters["price"] = "$$$"

    db_cities = [r["city"].lower() for r in db["restaurants"].find({}, {"city": 1}) if r.get("city")]
    for city in set(db_cities):
        if city in q_lower:
            filters["city"] = city
            break

    ambiance_keywords = ["romantic", "casual", "family", "outdoor", "cozy", "quiet",
                         "date", "anniversary", "birthday", "brunch", "dinner", "lunch"]
    found_ambiance = [k for k in ambiance_keywords if k in q_lower]
    if found_ambiance:
        filters["ambiance"] = found_ambiance

    dietary_keywords = ["vegan", "vegetarian", "halal", "gluten-free", "kosher", "dairy-free"]
    found_dietary = [k for k in dietary_keywords if k in q_lower]
    if found_dietary:
        filters["dietary"] = found_dietary

    return filters


def _query_restaurants(db, q_lower: str, filters: dict, limit: int = 5) -> list:
    filt = {}

    cuisine = filters.get("cuisine")
    if cuisine:
        filt["cuisine_type"] = {"$regex": cuisine, "$options": "i"}

    price = filters.get("price")
    if price:
        filt["pricing_tier"] = price

    city = filters.get("city")
    if city:
        filt["city"] = {"$regex": city, "$options": "i"}

    dietary = filters.get("dietary", [])
    ambiance = filters.get("ambiance", [])
    extra_keywords = dietary + ambiance
    if extra_keywords:
        kw_or = []
        for kw in extra_keywords:
            kw_or.append({"description": {"$regex": kw, "$options": "i"}})
            kw_or.append({"amenities": {"$regex": kw, "$options": "i"}})
        filt["$or"] = kw_or

    results = list(db["restaurants"].find(filt).sort("average_rating", -1).limit(limit))

    if not results and q_lower:
        results = list(db["restaurants"].find({"$or": [
            {"name": {"$regex": q_lower, "$options": "i"}},
            {"cuisine_type": {"$regex": q_lower, "$options": "i"}},
            {"city": {"$regex": q_lower, "$options": "i"}},
            {"description": {"$regex": q_lower, "$options": "i"}},
        ]}).sort("average_rating", -1).limit(limit))

    # Attach reviews for context
    for r in results:
        r["reviews"] = list(db["reviews"].find({"restaurant_id": r["id"]}).limit(3))

    return results


def _format_rec(r: dict) -> RestaurantRec:
    return RestaurantRec(
        id=r["id"], name=r["name"], cuisine_type=r.get("cuisine_type"),
        average_rating=float(r.get("average_rating") or 0.0),
        pricing_tier=r.get("pricing_tier"), city=r.get("city"),
        description=r.get("description"),
    )


def _build_messages(message, history, recommendations, prefs):
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    pref_summary = ""
    if prefs:
        parts = []
        if prefs.get("cuisine_preferences"): parts.append(f"Cuisine: {prefs['cuisine_preferences']}")
        if prefs.get("price_range"): parts.append(f"Price: {prefs['price_range']}")
        if prefs.get("dietary_needs"): parts.append(f"Dietary: {prefs['dietary_needs']}")
        if prefs.get("ambiance_preferences"): parts.append(f"Ambiance: {prefs['ambiance_preferences']}")
        pref_summary = ". ".join(parts)

    rec_summary = ""
    if recommendations:
        blocks = []
        for i, r in enumerate(recommendations[:5], 1):
            rating = float(r.get("average_rating") or 0)
            lines = [f"{i}. {r['name']} | Cuisine: {r.get('cuisine_type','N/A')} | Price: {r.get('pricing_tier','N/A')} | Rating: ★{rating:.1f} | City: {r.get('city','N/A')}"]
            if r.get("description"):
                lines.append(f"   {r['description']}")
            for rev in r.get("reviews", []):
                lines.append(f"   Review ★{rev['rating']}: \"{rev.get('comment','')}\"")
            blocks.append("\n".join(lines))
        rec_summary = "\n\n".join(blocks)

    system_content = (
        "You are a helpful restaurant recommendation assistant for a Yelp-like platform. "
        "Be concise and conversational. Bold every restaurant name using **Name** markdown. "
        "Do NOT include URLs, IDs, or file paths in your response."
    )
    if pref_summary:
        system_content += f" User's soft preferences: {pref_summary}. Use these as hints, don't exclude non-matching restaurants."

    msgs = [SystemMessage(content=system_content)]
    for m in history[:-1]:
        msgs.append(HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content))

    augmented = (
        f"{message}\n\n[Restaurants found:\n{rec_summary}]\nRecommend ONLY from this list."
        if rec_summary else
        f"{message}\n\n[No matching restaurants found. Tell the user and suggest different search terms.]"
    )
    msgs.append(HumanMessage(content=augmented))
    return msgs


def _build_reply_with_llm(message, history, recommendations, prefs, filters):
    import logging
    log = logging.getLogger(__name__)

    msgs = _build_messages(message, history, recommendations, prefs)

    # Tier 1: Ollama (free, local / self-hosted)
    try:
        from langchain_ollama import ChatOllama
        llm = ChatOllama(model=settings.OLLAMA_MODEL, temperature=0.7, base_url=settings.OLLAMA_BASE_URL, timeout=30)
        response = llm.invoke(msgs)
        return response.content, "ollama"
    except Exception as e:
        log.warning(f"Ollama unavailable ({e}), trying OpenAI fallback...")

    # Tier 2: OpenAI (cloud, requires OPENAI_API_KEY in .env)
    if settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, api_key=settings.OPENAI_API_KEY)
            response = llm.invoke(msgs)
            return response.content, "openai"
        except Exception as e:
            log.warning(f"OpenAI fallback failed ({e}), using template reply...")

    # Tier 3: Static template (always works, no external dependencies)
    return _build_template_reply(message, recommendations, prefs, filters), "template"


def _build_template_reply(message, recommendations, prefs, filters):
    if not recommendations:
        return "I couldn't find any restaurants matching your request. Try a different cuisine, location, or search term."

    context_parts = []
    if filters.get("cuisine"): context_parts.append(filters["cuisine"])
    if filters.get("ambiance"): context_parts.append(", ".join(filters["ambiance"]))
    if filters.get("dietary"): context_parts.append(", ".join(filters["dietary"]))

    intro = "Based on your request" + (f" for {', '.join(context_parts)}" if context_parts else "") + ", here are my recommendations:\n\n"

    lines = []
    for i, r in enumerate(recommendations[:5], 1):
        rating = float(r.get("average_rating") or 0)
        line = f"{i}. **{r['name']}** (★{rating:.1f}"
        if r.get("pricing_tier"): line += f", {r['pricing_tier']}"
        if r.get("cuisine_type"): line += f", {r['cuisine_type']}"
        if r.get("city"): line += f", {r['city']}"
        line += ")"
        if r.get("description"): line += f" — {r['description'][:100]}"
        lines.append(line)

    return intro + "\n".join(lines)


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db=Depends(get_db), current_user=Depends(get_optional_user)):
    history = list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    q_lower = (req.message or "").strip().lower()
    prefs = db["preferences"].find_one({"user_id": current_user["id"]}) if current_user else None
    filters = _build_filters_from_query(db, q_lower)
    matches = _query_restaurants(db, q_lower, filters)
    recommendations = [_format_rec(r) for r in matches]
    reply, source = _build_reply_with_llm(req.message, history, matches, prefs, filters)
    history.append(ChatMessage(role="assistant", content=reply))

    return ChatResponse(reply=reply, conversation_history=history, recommendations=recommendations, source=source)


def _smart_template_summary(rest_name: str, reviews: list, commented: list) -> str:
    """Build a human-readable summary from review text without an LLM."""
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1)
    pos_reviews = [r for r in commented if r["rating"] >= 4]
    neg_reviews = [r for r in commented if r["rating"] <= 2]

    # Extract quoted snippets from top positive and negative reviews
    pos_snippets = []
    for r in sorted(pos_reviews, key=lambda x: x["rating"], reverse=True)[:3]:
        words = (r.get("comment") or "").split()
        if len(words) >= 5:
            # Grab a short phrase (first 10 words)
            pos_snippets.append(" ".join(words[:10]).rstrip(".,!"))

    neg_snippets = []
    for r in sorted(neg_reviews, key=lambda x: x["rating"])[:2]:
        words = (r.get("comment") or "").split()
        if len(words) >= 5:
            neg_snippets.append(" ".join(words[:8]).rstrip(".,!"))

    summary = f"Customers rate {rest_name} ★{avg} across {len(reviews)} review{'s' if len(reviews) != 1 else ''}."
    if pos_snippets:
        summary += f" Highlights include \"{pos_snippets[0]}\"" + (f" and \"{pos_snippets[1]}\"" if len(pos_snippets) > 1 else "") + "."
    if neg_snippets:
        summary += f" Some reviewers noted: \"{neg_snippets[0]}\"."
    elif not pos_snippets:
        summary += " Reviewers generally had a positive experience."
    return summary


@router.get("/restaurant/{restaurant_id}/summary")
def get_review_summary(restaurant_id: int, db=Depends(get_db)):
    restaurant = db["restaurants"].find_one({"id": restaurant_id})
    if not restaurant:
        return {"summary": None, "source": "none"}

    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}).limit(20))
    commented = [r for r in reviews if r.get("comment")]
    if len(commented) < 2:
        return {"summary": None, "source": "none"}

    rest_name = restaurant["name"]
    current_count = len(reviews)

    # ── Return cached summary if review count hasn't changed AND it came from a real LLM ──
    cached = restaurant.get("ai_summary")
    cached_count = restaurant.get("ai_summary_review_count", 0)
    cached_source = restaurant.get("ai_summary_source", "template")
    if cached and cached_count == current_count and cached_source != "template":
        return {"summary": cached, "source": cached_source}

    # ── Generate fresh summary ──
    review_text = "\n".join([f"★{r['rating']}: {r['comment']}" for r in commented[:15]])
    prompt = (
        f"In exactly 2 sentences, summarize what customers say about {rest_name}. "
        f"Mention what they love and any concerns. Be specific.\n\nReviews:\n{review_text}"
    )
    summary, source = None, "template"

    try:
        from langchain_ollama import ChatOllama
        from langchain_core.messages import HumanMessage
        llm = ChatOllama(
            model=settings.OLLAMA_MODEL, temperature=0.3,
            base_url=settings.OLLAMA_BASE_URL,
            timeout=30,
        )
        summary = llm.invoke([HumanMessage(content=prompt)]).content.strip()
        source = "ollama"
    except Exception:
        pass

    if not summary and settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import HumanMessage
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=settings.OPENAI_API_KEY, timeout=10)
            summary = llm.invoke([HumanMessage(content=prompt)]).content.strip()
            source = "openai"
        except Exception:
            pass

    if not summary:
        summary = _smart_template_summary(rest_name, reviews, commented)
        source = "template"

    # ── Cache in MongoDB ──
    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$set": {"ai_summary": summary, "ai_summary_source": source, "ai_summary_review_count": current_count}},
    )
    return {"summary": summary, "source": source}


@router.post("/chat/anonymous", response_model=ChatResponse)
def chat_anonymous(req: ChatRequest, db=Depends(get_db)):
    history = list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    q_lower = (req.message or "").strip().lower()
    filters = _build_filters_from_query(db, q_lower)
    matches = _query_restaurants(db, q_lower, filters)
    recommendations = [_format_rec(r) for r in matches]
    reply = _build_template_reply(req.message, matches, None, filters)
    history.append(ChatMessage(role="assistant", content=reply))

    return ChatResponse(reply=reply, conversation_history=history, recommendations=recommendations, source="template")
