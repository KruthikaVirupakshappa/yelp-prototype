import json
import logging
import os

log = logging.getLogger(__name__)
_producer = None


def _get_producer():
    global _producer
    if _producer is not None:
        return _producer
    try:
        from kafka import KafkaProducer
        _producer = KafkaProducer(
            bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            request_timeout_ms=3000,
            retries=1,
        )
        log.info("Kafka producer connected")
    except Exception as e:
        log.warning("Kafka unavailable, events will be skipped: %s", e)
        _producer = None
    return _producer


def publish(topic: str, data: dict):
    producer = _get_producer()
    if producer is None:
        return
    try:
        producer.send(topic, data)
        producer.flush(timeout=1)
    except Exception as e:
        log.warning("Failed to publish to %s: %s", topic, e)
