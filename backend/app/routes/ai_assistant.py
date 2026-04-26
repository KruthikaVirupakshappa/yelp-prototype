import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Literal, Optional
from jose import JWTError, jwt

from app.database import get_db
from app.config import get_settings

log = logging.getLogger(__name__)
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


# ── Schemas ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    conversation_id: Optional[str] = None


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
    conversation_id: Optional[str] = None


# ── Data helpers ───────────────────────────────────────────────────────────────

def _get_all_restaurants(db) -> list:
    restaurants = list(db["restaurants"].find().sort("average_rating", -1))
    for r in restaurants:
        r["reviews"] = list(
            db["reviews"].find({"restaurant_id": r["id"]}).sort("rating", -1).limit(3)
        )
    return restaurants


def _get_user_context(db, user_id: int) -> dict:
    favorites = list(db["favorites"].find({"user_id": user_id}))
    fav_ids = [f["restaurant_id"] for f in favorites]
    fav_names = [
        r["name"] for r in db["restaurants"].find({"id": {"$in": fav_ids}}, {"name": 1})
    ]

    user_reviews = list(
        db["reviews"].find({"user_id": user_id}).sort("created_at", -1).limit(10)
    )
    reviewed_ids = [r["restaurant_id"] for r in user_reviews]
    reviewed_map = {
        r["id"]: r["name"]
        for r in db["restaurants"].find({"id": {"$in": reviewed_ids}}, {"name": 1, "id": 1})
    }
    reviewed = [
        {"name": reviewed_map.get(r["restaurant_id"], "Unknown"), "rating": r["rating"]}
        for r in user_reviews
    ]
    return {"favorites": fav_names, "reviewed": reviewed}


def _format_rec(r: dict) -> RestaurantRec:
    return RestaurantRec(
        id=r["id"], name=r["name"], cuisine_type=r.get("cuisine_type"),
        average_rating=float(r.get("average_rating") or 0.0),
        pricing_tier=r.get("pricing_tier"), city=r.get("city"),
        description=r.get("description"),
    )


def _extract_recommendations(reply: str, all_restaurants: list) -> list:
    reply_lower = reply.lower()
    return [_format_rec(r) for r in all_restaurants if r["name"].lower() in reply_lower]


# ── Conversation persistence ───────────────────────────────────────────────────

def _save_conversation(db, conversation_id: str, user_id: Optional[int], history: list):
    now = datetime.now(timezone.utc)
    messages = [{"role": m.role, "content": m.content} for m in history]
    db["conversations"].update_one(
        {"conversation_id": conversation_id},
        {
            "$set": {"user_id": user_id, "messages": messages, "updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


def _load_conversation(db, conversation_id: str) -> list:
    doc = db["conversations"].find_one({"conversation_id": conversation_id})
    if not doc:
        return []
    return [ChatMessage(role=m["role"], content=m["content"]) for m in doc.get("messages", [])]


# ── LLM prompt builder ─────────────────────────────────────────────────────────

def _build_messages(message, history, all_restaurants, prefs, user_context):
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    # Preferences
    pref_parts = []
    if prefs:
        if prefs.get("cuisine_preferences"): pref_parts.append(f"Cuisine: {prefs['cuisine_preferences']}")
        if prefs.get("price_range"):         pref_parts.append(f"Price: {prefs['price_range']}")
        if prefs.get("dietary_needs"):       pref_parts.append(f"Dietary: {prefs['dietary_needs']}")
        if prefs.get("ambiance_preferences"):pref_parts.append(f"Ambiance: {prefs['ambiance_preferences']}")

    # User history
    history_parts = []
    if user_context:
        if user_context["favorites"]:
            history_parts.append(f"Saved favourites: {', '.join(user_context['favorites'])}")
        if user_context["reviewed"]:
            visited = ", ".join(
                f"{r['name']} (★{r['rating']})" for r in user_context["reviewed"][:5]
            )
            history_parts.append(f"Previously visited: {visited}")

    # Full restaurant catalog
    catalog_lines = []
    for i, r in enumerate(all_restaurants, 1):
        rating = float(r.get("average_rating") or 0)
        line = (
            f"{i}. **{r['name']}** | {r.get('cuisine_type','N/A')} | "
            f"{r.get('pricing_tier','N/A')} | ★{rating:.1f} | {r.get('city','N/A')}"
        )
        if r.get("description"):
            line += f"\n   {r['description']}"
        if r.get("hours_of_operation"):
            line += f"\n   Hours: {r['hours_of_operation']}"
        if r.get("amenities"):
            line += f"\n   Amenities: {r['amenities']}"
        for rev in r.get("reviews", []):
            if rev.get("comment"):
                line += f"\n   ★{rev['rating']}: \"{rev['comment']}\""
        catalog_lines.append(line)

    system_content = (
        "You are a helpful restaurant recommendation assistant. "
        "Below is the COMPLETE list of restaurants in our database. "
        "Recommend ONLY from this list — do not invent restaurants. "
        "Bold every restaurant name using **Name** markdown. "
        "Do NOT include URLs, IDs, or file paths. "
        "If no restaurants closely match, say so and suggest the closest alternatives from the list.\n\n"
        "RESTAURANTS:\n" + "\n\n".join(catalog_lines)
    )
    if pref_parts:
        system_content += f"\n\nUser preferences (soft hints): {'. '.join(pref_parts)}."
    if history_parts:
        system_content += (
            f"\n\nUser history: {'. '.join(history_parts)}. "
            "Avoid suggesting places they've already visited unless they ask."
        )

    msgs = [SystemMessage(content=system_content)]
    for m in history[:-1]:
        msgs.append(HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content))
    msgs.append(HumanMessage(content=message))
    return msgs


# ── LLM reply ─────────────────────────────────────────────────────────────────

def _build_reply_with_llm(message, history, all_restaurants, prefs, user_context):
    msgs = _build_messages(message, history, all_restaurants, prefs, user_context)

    # Tier 1: Ollama
    try:
        from langchain_ollama import ChatOllama
        llm = ChatOllama(
            model=settings.OLLAMA_MODEL, temperature=0.7,
            base_url=settings.OLLAMA_BASE_URL, timeout=30,
        )
        return llm.invoke(msgs).content, "ollama"
    except Exception as e:
        log.warning(f"Ollama unavailable ({e}), trying OpenAI...")

    # Tier 2: OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, api_key=settings.OPENAI_API_KEY)
            return llm.invoke(msgs).content, "openai"
        except Exception as e:
            log.warning(f"OpenAI failed ({e}), using template...")

    # Tier 3: Template
    return _build_template_reply(message, all_restaurants), "template"


def _build_template_reply(message: str, all_restaurants: list) -> str:
    q = message.lower()
    matches = [
        r for r in all_restaurants
        if r.get("cuisine_type", "").lower() in q
        or r.get("city", "").lower() in q
        or any(w in (r.get("description") or "").lower() for w in q.split() if len(w) > 3)
    ]
    results = matches[:5] if matches else all_restaurants[:5]
    intro = "Here are some restaurants you might enjoy:\n\n"
    lines = []
    for i, r in enumerate(results, 1):
        rating = float(r.get("average_rating") or 0)
        line = f"{i}. **{r['name']}** (★{rating:.1f}"
        if r.get("pricing_tier"): line += f", {r['pricing_tier']}"
        if r.get("cuisine_type"): line += f", {r['cuisine_type']}"
        if r.get("city"):         line += f", {r['city']}"
        line += ")"
        if r.get("description"):  line += f" — {r['description'][:100]}"
        lines.append(line)
    return intro + "\n".join(lines)


# ── Chat endpoints ─────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db=Depends(get_db), current_user=Depends(get_optional_user)):
    conv_id = req.conversation_id or str(uuid.uuid4())
    history = _load_conversation(db, conv_id) if req.conversation_id else list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    prefs = db["preferences"].find_one({"user_id": current_user["id"]}) if current_user else None
    user_context = _get_user_context(db, current_user["id"]) if current_user else None
    all_restaurants = _get_all_restaurants(db)

    reply, source = _build_reply_with_llm(req.message, history, all_restaurants, prefs, user_context)
    history.append(ChatMessage(role="assistant", content=reply))

    _save_conversation(db, conv_id, current_user["id"] if current_user else None, history)

    return ChatResponse(
        reply=reply,
        conversation_history=history,
        recommendations=_extract_recommendations(reply, all_restaurants),
        source=source,
        conversation_id=conv_id,
    )


@router.post("/chat/anonymous", response_model=ChatResponse)
def chat_anonymous(req: ChatRequest, db=Depends(get_db)):
    conv_id = req.conversation_id or str(uuid.uuid4())
    history = _load_conversation(db, conv_id) if req.conversation_id else list(req.conversation_history or [])
    history.append(ChatMessage(role="user", content=req.message))

    all_restaurants = _get_all_restaurants(db)
    reply = _build_template_reply(req.message, all_restaurants)
    history.append(ChatMessage(role="assistant", content=reply))

    _save_conversation(db, conv_id, None, history)

    return ChatResponse(
        reply=reply,
        conversation_history=history,
        recommendations=_extract_recommendations(reply, all_restaurants),
        source="template",
        conversation_id=conv_id,
    )


# ── AI Review Summary ──────────────────────────────────────────────────────────

def _build_summary_prompt(rest_name: str, restaurant: dict, reviews: list, commented: list) -> str:
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1)

    # Rating distribution
    dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in reviews:
        dist[r["rating"]] = dist.get(r["rating"], 0) + 1
    dist_str = ", ".join(f"★{k}: {v}" for k, v in sorted(dist.items(), reverse=True) if v > 0)

    # Owner reply info
    replied = sum(1 for r in reviews if r.get("owner_reply"))
    owner_note = f"The owner has responded to {replied} of {len(reviews)} reviews." if replied else ""

    # Reviews text — sorted best then worst for balance
    sorted_reviews = sorted(commented, key=lambda r: r["rating"], reverse=True)
    review_lines = []
    for r in sorted_reviews[:15]:
        line = f"★{r['rating']}: {r['comment']}"
        if r.get("owner_reply"):
            line += f" [Owner replied: {r['owner_reply'][:80]}]"
        review_lines.append(line)

    extras = []
    if restaurant.get("amenities"):
        extras.append(f"Amenities: {restaurant['amenities']}")
    if restaurant.get("hours_of_operation"):
        extras.append(f"Hours: {restaurant['hours_of_operation']}")
    if restaurant.get("pricing_tier"):
        extras.append(f"Price range: {restaurant['pricing_tier']}")

    return (
        f"You are summarizing customer reviews for **{rest_name}**, "
        f"a {restaurant.get('cuisine_type','') or ''} restaurant in {restaurant.get('city','') or ''}.\n\n"
        f"Stats: Average ★{avg} from {len(reviews)} reviews. Distribution: {dist_str}.\n"
        + (f"{owner_note}\n" if owner_note else "")
        + (f"Restaurant info: {'. '.join(extras)}\n" if extras else "")
        + f"\nCustomer reviews:\n" + "\n".join(review_lines)
        + "\n\nWrite a 2–3 sentence summary that:\n"
        "1. Captures what customers consistently love\n"
        "2. Mentions any recurring concerns or areas for improvement\n"
        "3. Notes if the owner is responsive (if applicable)\n"
        "Be specific and natural — avoid generic phrases like 'great experience'."
    )


def _smart_template_summary(rest_name: str, reviews: list, commented: list) -> str:
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1)
    pos = sorted([r for r in commented if r["rating"] >= 4], key=lambda x: x["rating"], reverse=True)
    neg = sorted([r for r in commented if r["rating"] <= 2], key=lambda x: x["rating"])

    pos_snippets = [" ".join((r.get("comment") or "").split()[:10]).rstrip(".,!") for r in pos[:2] if len((r.get("comment") or "").split()) >= 5]
    neg_snippets = [" ".join((r.get("comment") or "").split()[:8]).rstrip(".,!") for r in neg[:1] if len((r.get("comment") or "").split()) >= 5]

    summary = f"Customers rate {rest_name} ★{avg} across {len(reviews)} review{'s' if len(reviews) != 1 else ''}."
    if pos_snippets:
        summary += f" Highlights include \"{pos_snippets[0]}\""
        if len(pos_snippets) > 1:
            summary += f" and \"{pos_snippets[1]}\""
        summary += "."
    if neg_snippets:
        summary += f" Some reviewers noted: \"{neg_snippets[0]}\"."
    elif not pos_snippets:
        summary += " Reviewers generally had a positive experience."
    return summary


def _invoke_llm_for_summary(prompt: str) -> tuple:
    from langchain_core.messages import SystemMessage, HumanMessage

    system = (
        "You are a concise review analyst. Write clear, specific, honest summaries "
        "based only on the reviews provided. Never fabricate details."
    )

    # Tier 1: Ollama
    try:
        from langchain_ollama import ChatOllama
        llm = ChatOllama(model=settings.OLLAMA_MODEL, temperature=0.3, base_url=settings.OLLAMA_BASE_URL, timeout=30)
        result = llm.invoke([SystemMessage(content=system), HumanMessage(content=prompt)]).content.strip()
        return result, "ollama"
    except Exception:
        pass

    # Tier 2: OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=settings.OPENAI_API_KEY, timeout=15)
            result = llm.invoke([SystemMessage(content=system), HumanMessage(content=prompt)]).content.strip()
            return result, "openai"
        except Exception:
            pass

    return None, "template"


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

    cached = restaurant.get("ai_summary")
    cached_count = restaurant.get("ai_summary_review_count", 0)
    cached_source = restaurant.get("ai_summary_source", "template")
    if cached and cached_count == current_count and cached_source != "template":
        return {"summary": cached, "source": cached_source}

    prompt = _build_summary_prompt(rest_name, restaurant, reviews, commented)
    summary, source = _invoke_llm_for_summary(prompt)


    if not summary:
        summary = _smart_template_summary(rest_name, reviews, commented)
        source = "template"

    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$set": {"ai_summary": summary, "ai_summary_source": source, "ai_summary_review_count": current_count}},
    )
    return {"summary": summary, "source": source}
