from pymongo import MongoClient, ASCENDING, DESCENDING
from app.config import get_settings

settings = get_settings()

client = MongoClient(settings.MONGODB_URL)
_db = client[settings.MONGODB_DB_NAME]


def get_db():
    return _db


def get_next_id(collection_name: str) -> int:
    result = _db["counters"].find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return result["seq"]


def ensure_indexes():
    _db["users"].create_index("email", unique=True)
    _db["users"].create_index("id", unique=True)
    _db["restaurants"].create_index("id", unique=True)
    _db["restaurants"].create_index("name")
    _db["restaurants"].create_index("cuisine_type")
    _db["restaurants"].create_index("city")
    _db["reviews"].create_index("id", unique=True)
    _db["reviews"].create_index([("user_id", ASCENDING), ("restaurant_id", ASCENDING)])
    _db["favorites"].create_index([("user_id", ASCENDING), ("restaurant_id", ASCENDING)], unique=True)
    _db["sessions"].create_index("user_id")
    _db["sessions"].create_index("token", unique=True)
    _db["activity_logs"].create_index("user_id")
    _db["activity_logs"].create_index("created_at")
