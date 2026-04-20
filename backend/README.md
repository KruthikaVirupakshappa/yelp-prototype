# Fork & Fire — Backend

FastAPI backend split into **4 microservices** + **3 Kafka worker consumers**, all backed by MongoDB.

---

## Services

| Service | Entry point | Port | Routes |
|---|---|---|---|
| User / Reviewer | `main_user.py` | 8001 | `/api/auth/`, `/api/users/`, `/api/preferences/` |
| Restaurant | `main_restaurant.py` | 8002 | `/api/restaurants/` |
| Restaurant Owner | `main_owner.py` | 8003 | `/api/owner/` |
| Review | `main_review.py` | 8004 | `/api/reviews/`, `/api/favorites/`, `/api/ai-assistant/` |

## Kafka Workers (Consumers)

| Worker | File | Listens on |
|---|---|---|
| Review Worker | `review_worker.py` | `review.created`, `review.updated`, `review.deleted` |
| Restaurant Worker | `restaurant_worker.py` | `restaurant.created`, `restaurant.updated`, `restaurant.claimed` |
| User Worker | `user_worker.py` | `user.created`, `user.updated` |

---

## Running with Docker

```bash
# From project root
docker-compose up --build
```

Each service gets its own container. See [docker-compose.yml](../docker-compose.yml).

---

## Running Locally (monolith mode)

All routes on a single FastAPI app at port 8000 — easiest for development.

```bash
cd backend
source ../env/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: http://localhost:8000/docs

### Seed sample data

```bash
python seed_data.py
```

### Kill port 8000 if already in use

```bash
kill -9 $(lsof -t -i:8000)
```

---

## Running individual microservices locally

```bash
source ../env/bin/activate

# User Service
uvicorn main_user:app --port 8001 --reload

# Restaurant Service
uvicorn main_restaurant:app --port 8002 --reload

# Restaurant Owner Service
uvicorn main_owner:app --port 8003 --reload

# Review Service
uvicorn main_review:app --port 8004 --reload

# Workers (in separate terminals)
python review_worker.py
python restaurant_worker.py
python user_worker.py
```

---

## API Endpoints

### Authentication — User Service (:8001)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user or owner |
| POST | `/api/auth/login` | Login and receive JWT token |

### Users — User Service (:8001)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/users/me/profile-picture` | Upload profile picture |

### Preferences — User Service (:8001)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/preferences/` | Get preferences |
| PUT | `/api/preferences/` | Update preferences |

### Restaurants — Restaurant Service (:8002)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/restaurants/` | Create restaurant |
| GET | `/api/restaurants/` | Search/list restaurants |
| GET | `/api/restaurants/{id}` | Get restaurant details |
| PUT | `/api/restaurants/{id}` | Update restaurant |
| POST | `/api/restaurants/{id}/photos` | Upload photo |
| POST | `/api/restaurants/{id}/claim` | Claim restaurant (owners only) |

### Owner Dashboard — Restaurant Owner Service (:8003)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/owner/restaurants` | List owned restaurants |
| GET | `/api/owner/restaurants/{id}/reviews` | Reviews for owned restaurant |
| GET | `/api/owner/unclaimed` | Browse unclaimed restaurants |
| GET | `/api/owner/dashboard` | Analytics dashboard |

### Reviews — Review Service (:8004)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reviews/` | Submit review (triggers Kafka event) |
| GET | `/api/reviews/restaurant/{id}` | Get restaurant reviews |
| PUT | `/api/reviews/{id}` | Update own review |
| DELETE | `/api/reviews/{id}` | Delete own review |
| GET | `/api/reviews/user/history` | Current user's review history |

### Favorites — Review Service (:8004)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/favorites/{restaurant_id}` | Add to favorites |
| DELETE | `/api/favorites/{restaurant_id}` | Remove from favorites |
| GET | `/api/favorites/` | List favorites |

### AI Assistant — Review Service (:8004)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai-assistant/chat` | Required | Chat with AI (uses Ollama) |
| POST | `/api/ai-assistant/chat/anonymous` | None | Anonymous AI chat |

---

## MongoDB Collections

| Collection | Description |
|---|---|
| `users` | User accounts with bcrypt-hashed passwords |
| `sessions` | JWT sessions keyed by user_id |
| `restaurants` | Restaurant records with embedded photos array |
| `reviews` | Review documents |
| `favorites` | User–restaurant favorite pairs |
| `preferences` | Per-user cuisine/dietary/ambiance preferences |
| `activity_logs` | Audit log of user actions |
| `counters` | Auto-increment sequence tracker |

---

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=yelp_db
SECRET_KEY=<generate with: python3 -c "import secrets; print(secrets.token_hex(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=uploads
OLLAMA_MODEL=llama3.2:latest
OLLAMA_BASE_URL=http://localhost:11434
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```
