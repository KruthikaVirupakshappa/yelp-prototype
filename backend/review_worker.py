"""
review_worker.py — Kafka consumer for async review processing.
Listens on topics: review.created, review.updated, review.deleted
Updates restaurant rating stats after each event.
"""
import json
import logging
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
from app.database import _db as db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [worker] %(message)s")
log = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPICS = ["review.created", "review.updated", "review.deleted"]
GROUP_ID = "review-worker-group"


def _update_restaurant_stats(restaurant_id: int):
    reviews = list(db["reviews"].find({"restaurant_id": restaurant_id}))
    count = len(reviews)
    avg = round(sum(r["rating"] for r in reviews) / count, 2) if count > 0 else 0.0
    db["restaurants"].update_one(
        {"id": restaurant_id},
        {"$set": {"average_rating": avg, "review_count": count}},
    )
    log.info("Updated restaurant %d → avg=%.2f count=%d", restaurant_id, avg, count)


def make_consumer():
    while True:
        try:
            consumer = KafkaConsumer(
                *TOPICS,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                group_id=GROUP_ID,
                auto_offset_reset="earliest",
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                enable_auto_commit=True,
            )
            log.info("Connected to Kafka at %s, listening on %s", KAFKA_BOOTSTRAP, TOPICS)
            return consumer
        except NoBrokersAvailable:
            log.warning("Kafka not available yet, retrying in 5s...")
            time.sleep(5)


def run():
    consumer = make_consumer()
    for message in consumer:
        topic = message.topic
        data = message.value
        log.info("Received [%s]: %s", topic, data)
        try:
            if topic in ("review.created", "review.updated", "review.deleted"):
                restaurant_id = data.get("restaurant_id")
                if restaurant_id:
                    _update_restaurant_stats(restaurant_id)
        except Exception as e:
            log.error("Error processing message on %s: %s", topic, e)


if __name__ == "__main__":
    run()
