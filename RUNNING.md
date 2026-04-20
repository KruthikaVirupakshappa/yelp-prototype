# Fork & Fire — Running the App

---

## Option A: Docker (Recommended)

One command starts everything — MongoDB, Kafka, all 4 microservices, 3 workers, and the frontend.

### Prerequisites
- Docker Desktop running
- Ollama installed (for AI assistant)

### Steps

```bash
# From project root
cd yelp-prototype

# Start Ollama separately on your host (Docker cannot reach it otherwise)
ollama serve   # skip if already running as a background service

# Start the full stack
docker-compose up --build
```

First run takes 5–10 minutes to build all images. Subsequent runs are fast (images cached).

**On first run**, the `db-seed` container automatically populates MongoDB with sample users, restaurants, and reviews.

Open **http://localhost** in your browser.

### Service ports (for direct API access / debugging)

| Service | Port | Docs |
|---|---|---|
| User / Reviewer Service | 8001 | http://localhost:8001/docs |
| Restaurant Service | 8002 | http://localhost:8002/docs |
| Restaurant Owner Service | 8003 | http://localhost:8003/docs |
| Review Service | 8004 | http://localhost:8004/docs |
| Frontend (nginx) | 80 | http://localhost |
| MongoDB | 27017 | — |
| Kafka | 9092 | — |

### Stopping

```bash
docker-compose down          # stop containers, keep data
docker-compose down -v       # stop + delete all volumes (wipes database)
```

### Re-seeding the database

```bash
docker-compose run --rm db-seed
```

---

## Option B: Local Development (no Docker)

Use this when you want hot-reload for active development.

See [SETUP.md](SETUP.md) first to install all dependencies.

### You need 3 terminals:

#### Terminal 1 — Ollama (AI assistant)

Check if already running:
```bash
curl http://localhost:11434/api/tags
```

If you get "connection refused":
```bash
ollama serve
```

#### Terminal 2 — Backend (single monolith, all routes on :8000)

```bash
cd yelp-prototype/backend
source ../env/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: http://localhost:8000/docs

If port 8000 is taken:
```bash
kill -9 $(lsof -t -i:8000)
```

#### Terminal 3 — Frontend (Vite dev server with hot reload)

```bash
cd yelp-prototype/yelp-frontend
npm run dev
```

Open http://localhost:5173

### Seeding sample data (first run only)

```bash
cd yelp-prototype/backend
source ../env/bin/activate
python seed_data.py
```

---

## Quick troubleshooting

| Symptom | Most likely cause | Fix |
|---|---|---|
| `http://localhost` shows nothing | Docker not running or build failed | `docker-compose up --build` and check logs |
| AI assistant returns template replies | Ollama not reachable | Run `ollama serve` on host; Docker uses `host.docker.internal:11434` |
| `401 Unauthorized` on all requests | JWT secret mismatch | Ensure `.env` SECRET_KEY matches across all services |
| MongoDB connection refused (local) | MongoDB not running | Start MongoDB: `brew services start mongodb-community` |
| Port 8000 in use | Another process | `kill -9 $(lsof -t -i:8000)` |
| `ModuleNotFoundError` (local) | venv not activated | `source ../env/bin/activate` |
| Frontend blank page (local) | Backend not running | Start backend first, check for errors |
