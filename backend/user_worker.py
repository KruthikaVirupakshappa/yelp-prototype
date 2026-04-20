"""
user_worker.py — Kafka consumer for async user event processing.
Listens on: user.created, user.updated
"""
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))

from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
from app.database import _db as db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [user-worker] %(message)s")
log = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPICS = ["user.created", "user.updated"]
GROUP_ID = "user-worker-group"


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
            user_id = data.get("user_id")
            if topic == "user.created":
                log.info("New user registered: id=%s email=%s role=%s", user_id, data.get("email"), data.get("role"))
                db["activity_logs"].insert_one({
                    "user_id": user_id,
                    "action": "user_created_processed",
                    "processed_at": datetime.now(timezone.utc),
                })
            elif topic == "user.updated":
                log.info("User %s updated fields: %s", user_id, data.get("fields"))
                db["activity_logs"].insert_one({
                    "user_id": user_id,
                    "action": "user_updated_processed",
                    "fields": data.get("fields", []),
                    "processed_at": datetime.now(timezone.utc),
                })
        except Exception as e:
            log.error("Error processing message on %s: %s", topic, e)


if __name__ == "__main__":
    run()
