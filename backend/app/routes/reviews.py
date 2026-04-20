from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database import get_db, get_next_id
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReplyCreate, VoteCreate
from app.auth import get_current_user
from app.kafka_producer import publish

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


def _update_restaurant_stats(db, restaurant_id: int):
    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}))
    count = len(reviews)
    avg = round(sum(r["rating"] for r in reviews) / count, 2) if count else 0.0
    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$set": {"average_rating": avg, "review_count": count}},
    )


def _to_response(r: dict, user_name: str = None) -> ReviewResponse:
    return ReviewResponse(
        id=r["id"], user_id=r["user_id"], restaurant_id=r["restaurant_id"],
        rating=r["rating"], comment=r.get("comment"), photo_url=r.get("photo_url"),
        created_at=r.get("created_at"), updated_at=r.get("updated_at"),
        user_name=user_name or r.get("user_name"),
        owner_reply=r.get("owner_reply"),
        owner_reply_at=r.get("owner_reply_at"),
        helpful_votes=r.get("helpful_votes", 0),
        unhelpful_votes=r.get("unhelpful_votes", 0),
    )


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    restaurant = db["restaurants"].find_one({"id": data.restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.get("owner_id") == current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot review your own restaurant")
    if db["reviews"].find_one({"user_id": current_user["id"], "restaurant_id": data.restaurant_id}):
        raise HTTPException(status_code=400, detail="You already reviewed this restaurant")

    now = datetime.now(timezone.utc)
    review = {
        "id": get_next_id("reviews"),
        "user_id": current_user["id"],
        "restaurant_id": data.restaurant_id,
        "rating": data.rating,
        "comment": data.comment,
        "photo_url": None,
        "created_at": now,
        "updated_at": now,
    }
    db["reviews"].insert_one(review)
    _update_restaurant_stats(db, data.restaurant_id)
    db["activity_logs"].insert_one({
        "user_id": current_user["id"], "action": "review_created",
        "restaurant_id": data.restaurant_id, "created_at": now,
    })
    publish("review.created", {
        "review_id": review["id"], "restaurant_id": data.restaurant_id,
        "user_id": current_user["id"], "rating": data.rating,
    })
    return _to_response(review, current_user["name"])


@router.get("/restaurant/{restaurant_id}", response_model=List[ReviewResponse])
def get_restaurant_reviews(restaurant_id: int, db=Depends(get_db)):
    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}).sort("created_at", -1))
    result = []
    for r in reviews:
        user = db["users"].find_one({"id": r["user_id"]})
        result.append(_to_response(r, user["name"] if user else None))
    return result


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    db["reviews"].update_one({"id": review_id}, {"$set": update_data})
    _update_restaurant_stats(db, review["restaurant_id"])

    updated = db["reviews"].find_one({"id": review_id})
    publish("review.updated", {
        "review_id": review_id, "restaurant_id": review["restaurant_id"],
        "user_id": current_user["id"], "rating": updated.get("rating"),
    })
    return _to_response(updated, current_user["name"])


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    restaurant_id = review["restaurant_id"]
    db["reviews"].delete_one({"id": review_id})
    _update_restaurant_stats(db, restaurant_id)
    db["activity_logs"].insert_one({
        "user_id": current_user["id"], "action": "review_deleted",
        "restaurant_id": restaurant_id, "created_at": datetime.now(timezone.utc),
    })
    publish("review.deleted", {
        "review_id": review_id, "restaurant_id": restaurant_id,
        "user_id": current_user["id"],
    })


@router.get("/user/history", response_model=List[ReviewResponse])
def get_user_review_history(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reviews = list(db["reviews"].find({"user_id": current_user["id"]}).sort("created_at", -1))
    return [_to_response(r, current_user["name"]) for r in reviews]


@router.post("/{review_id}/reply", response_model=ReviewResponse)
def reply_to_review(
    review_id: int,
    data: ReplyCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    restaurant = db["restaurants"].find_one({"id": review["restaurant_id"]})
    if not restaurant or restaurant.get("owner_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the restaurant owner can reply")
    db["reviews"].update_one(
        {"id": review_id},
        {"$set": {"owner_reply": data.reply, "owner_reply_at": datetime.now(timezone.utc)}},
    )
    updated = db["reviews"].find_one({"id": review_id})
    user = db["users"].find_one({"id": updated["user_id"]})
    return _to_response(updated, user["name"] if user else None)


@router.delete("/{review_id}/reply", status_code=status.HTTP_204_NO_CONTENT)
def delete_reply(
    review_id: int,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    restaurant = db["restaurants"].find_one({"id": review["restaurant_id"]})
    if not restaurant or restaurant.get("owner_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the restaurant owner can delete their reply")
    db["reviews"].update_one({"id": review_id}, {"$unset": {"owner_reply": "", "owner_reply_at": ""}})


@router.post("/{review_id}/vote")
def vote_review(
    review_id: int,
    data: VoteCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    review = db["reviews"].find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot vote on your own review")

    voter_key = f"voters.{current_user['id']}"
    voters = review.get("voters", {})
    prev_vote = voters.get(str(current_user["id"]))

    inc_ops = {}
    set_ops = {}
    unset_ops = {}

    if prev_vote == data.vote:
        # Toggle off
        inc_ops[f"{data.vote}_votes"] = -1
        unset_ops[voter_key] = ""
    elif prev_vote:
        # Switch vote
        inc_ops[f"{prev_vote}_votes"] = -1
        inc_ops[f"{data.vote}_votes"] = 1
        set_ops[voter_key] = data.vote
    else:
        inc_ops[f"{data.vote}_votes"] = 1
        set_ops[voter_key] = data.vote

    update = {}
    if inc_ops:
        update["$inc"] = inc_ops
    if set_ops:
        update["$set"] = set_ops
    if unset_ops:
        update["$unset"] = unset_ops

    db["reviews"].update_one({"id": review_id}, update)
    updated = db["reviews"].find_one({"id": review_id})
    your_vote = updated.get("voters", {}).get(str(current_user["id"]))
    return {
        "helpful_votes": updated.get("helpful_votes", 0),
        "unhelpful_votes": updated.get("unhelpful_votes", 0),
        "your_vote": your_vote,
    }
