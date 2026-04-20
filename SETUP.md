# Fork & Fire — Environment Setup

This guide walks through setting up the full development environment from scratch.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB 7** (for local dev without Docker)
- **Docker Desktop** (for containerized runs)
- **Ollama** (AI assistant — runs locally, no API key needed)
- **Apache Kafka** (optional — only needed for local dev; Docker handles it automatically)

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/KruthikaVirupakshappa/yelp-prototype.git
cd yelp-prototype
```

---

## Step 2 — Configure environment files

**Project root** (for Docker / docker-compose):
```bash
cp .env.example .env
```

Edit `.env`:
```
SECRET_KEY=your-long-random-secret-key-here
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

Generate a secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Backend** (for local dev without Docker):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=yelp_db
SECRET_KEY=<same key as above>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=uploads
OLLAMA_MODEL=llama3.2:latest
OLLAMA_BASE_URL=http://localhost:11434
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

---

## Step 3 — MongoDB (local dev only)

Install MongoDB Community Edition:

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Verify:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

---

## Step 4 — Python virtual environment (local dev only)

```bash
cd backend
python3 -m venv ../env
source ../env/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### Seed the database

```bash
# Still inside backend/ with venv active
python seed_data.py
```

This creates sample users, restaurants, reviews, and favorites. Safe to run multiple times.

---

## Step 5 — Install Ollama and pull the model

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Pull the model (~2 GB, one time only):
```bash
ollama pull llama3.2:latest
```

Start Ollama (usually runs as a background service automatically):
```bash
ollama serve
```

Verify:
```bash
curl http://localhost:11434/api/tags
```

---

## Step 6 — Frontend (local dev only)

```bash
cd yelp-frontend
npm install
```

No additional config needed — the Vite dev server proxies `/api/` to `localhost:8000`.

---

## Step 7 — Docker setup (for containerized runs)

Make sure Docker Desktop is running, then from the project root:

```bash
docker-compose up --build
```

This builds and starts:
- MongoDB
- Zookeeper + Kafka
- User Service (port 8001)
- Restaurant Service (port 8002)
- Restaurant Owner Service (port 8003)
- Review Service (port 8004)
- Review Worker (Kafka consumer)
- Restaurant Worker (Kafka consumer)
- User Worker (Kafka consumer)
- Frontend / nginx (port 80)
- db-seed (runs once to populate MongoDB)

---

## Step 8 — Kubernetes (for cluster deployment)

```bash
# Apply all manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Check all pods are running
kubectl get pods
```

---

## Verify local setup

```bash
# Python environment
source env/bin/activate
python3 -c "import pymongo, fastapi, kafka; print('All packages OK')"

# MongoDB
mongosh --eval "db.adminCommand('ping')"

# Ollama
ollama list   # should show llama3.2:latest

# Node
node --version   # should be 18+
```

---

Now head to [RUNNING.md](RUNNING.md) to start the app.
