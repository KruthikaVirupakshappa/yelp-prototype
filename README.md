# Fork & Fire — Yelp Prototype

A full-stack restaurant discovery and review platform built for CMPE 236 Distributed Systems (Lab 1 + Lab 2).

---

## Architecture (Lab 2)

The backend is split into **4 independent microservices**, each with its own Dockerfile, connected through Kafka and MongoDB:

```
Frontend (React + Vite)
        │  nginx routes each /api/<prefix>/ to the correct service
        ▼
┌──────────────────┬───────────────────┬──────────────────────────┬───────────────┐
│  User Service    │ Restaurant Service│ Restaurant Owner Service │ Review Service│
│  :8001           │ :8002             │ :8003                    │ :8004         │
│  /api/auth/      │ /api/restaurants/ │ /api/owner/              │ /api/reviews/ │
│  /api/users/     │                   │                          │ /api/favorites│
│  /api/preferences│                   │                          │ /api/ai-assist│
└────────┬─────────┴────────┬──────────┴──────────────────────────┴───────┬───────┘
         │                  │                                               │
         ▼                  ▼                                               ▼
    Kafka Topics       Kafka Topics                                   Kafka Topics
  user.created       restaurant.created                            review.created
  user.updated       restaurant.updated                            review.updated
                     restaurant.claimed                            review.deleted
         │                  │                                               │
         ▼                  ▼                                               ▼
   User Worker       Restaurant Worker                             Review Worker
   (consumer)         (consumer)                                    (consumer)
         │                  │                                               │
         └──────────────────┴───────────────────────────────────────────────┘
                                        │
                                   MongoDB (shared)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router, Axios |
| Backend | FastAPI (4 microservices), PyMongo |
| Database | MongoDB 7 |
| Messaging | Apache Kafka (3 topics groups, 3 worker consumers) |
| AI Assistant | LangChain + Ollama (`llama3.2:latest`) |
| Containerization | Docker, docker-compose |
| Orchestration | Kubernetes (k8s/) |
| Performance Testing | Apache JMeter |

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/KruthikaVirupakshappa/yelp-prototype.git
cd yelp-prototype

# 2. Copy and configure env
cp .env.example .env          # edit SECRET_KEY if desired

# 3. Start everything (MongoDB, Kafka, all 4 services, 3 workers, frontend)
docker-compose up --build

# 4. Open the app
open http://localhost
```

The `db-seed` service runs automatically on first start and populates sample users, restaurants, and reviews.

For Ollama (AI assistant), run separately on your host:
```bash
ollama serve   # if not already running as a background service
```

---

## Running Locally (without Docker)

See [SETUP.md](SETUP.md) for full environment setup, then [RUNNING.md](RUNNING.md) for day-to-day startup.

---

## Project Structure

```
yelp-prototype/
├── backend/
│   ├── main.py                        # Monolith entry point (local dev)
│   ├── main_user.py                   # User/Reviewer Service entry point
│   ├── main_restaurant.py             # Restaurant Service entry point
│   ├── main_owner.py                  # Restaurant Owner Service entry point
│   ├── main_review.py                 # Review Service entry point
│   ├── review_worker.py               # Kafka consumer — review events
│   ├── restaurant_worker.py           # Kafka consumer — restaurant events
│   ├── user_worker.py                 # Kafka consumer — user events
│   ├── seed_data.py                   # Sample data seeder
│   ├── Dockerfile.user-service
│   ├── Dockerfile.restaurant-service
│   ├── Dockerfile.restaurant-owner-service
│   ├── Dockerfile.review-service
│   ├── Dockerfile.worker              # Review worker
│   ├── Dockerfile.restaurant-worker
│   ├── Dockerfile.user-worker
│   └── app/
│       ├── routes/                    # All API route handlers
│       ├── schemas/                   # Pydantic models
│       ├── database.py                # MongoDB connection
│       ├── config.py                  # Settings (pydantic-settings)
│       ├── auth.py                    # JWT + bcrypt helpers
│       └── kafka_producer.py          # Non-blocking Kafka publisher
├── yelp-frontend/
│   ├── src/
│   │   ├── store/                     # Redux slices (auth, restaurants, reviews, favorites)
│   │   ├── pages/
│   │   └── components/
│   ├── Dockerfile                     # Multi-stage: npm build → nginx
│   └── nginx.conf                     # Routes /api/* to correct microservice
├── k8s/                               # Kubernetes manifests
├── jmeter/                            # JMeter test plan (.jmx) + results
├── docker-compose.yml
└── .env.example
```

---

## Kafka Topics

| Topic | Producer | Consumer |
|---|---|---|
| `review.created` | Review Service | Review Worker |
| `review.updated` | Review Service | Review Worker |
| `review.deleted` | Review Service | Review Worker |
| `restaurant.created` | Restaurant Service | Restaurant Worker |
| `restaurant.updated` | Restaurant Service | Restaurant Worker |
| `restaurant.claimed` | Restaurant Service | Restaurant Worker |
| `user.created` | User Service | User Worker |
| `user.updated` | User Service | User Worker |

---

## Team Git Workflow

**Branches:**
- `main` — stable, production-ready

**Rules:**
1. Never commit directly to `main`
2. Always sync with `main` before starting work (`git rebase origin/main`)
3. Keep changes under new branch for each PR
4. Create a PR to merge into `main`

