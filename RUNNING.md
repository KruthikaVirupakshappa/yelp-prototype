# Fork & Fire — Running the App

Once you've completed [SETUP.md](SETUP.md), this is your day-to-day guide for starting everything up.

---

## Every time you start

You need three things running at the same time — Ollama, the backend, and the frontend. Open three terminal tabs.

---

### Tab 1 — Ollama (AI assistant)

Ollama usually starts automatically after installation. Check if it's already running:

```bash
curl http://localhost:11434/api/tags
```

If you get a JSON response back, it's already up. If you get "connection refused", start it manually:

```bash
ollama serve
```

Leave this tab open.

---

### Tab 2 — Backend (FastAPI)

```bash
cd yelp-prototype/backend

source ../env/bin/activate          # activate the Python venv
                                    # Windows: ..\env\Scripts\activate

uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

The `--reload` flag means the server automatically restarts whenever you edit a Python file — handy during development.

**If port 8000 is already taken:**
```bash
kill -9 $(lsof -t -i:8000)
```
Then try starting again.

**API docs** (useful for testing endpoints directly):
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

### Tab 3 — Frontend (React + Vite)

```bash
cd yelp-prototype/yelp-frontend

npm run dev
```

You'll see something like:
```
VITE ready in 300ms
➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser and the app should load.

---

## Stopping everything

- **Frontend:** `Ctrl+C` in the frontend terminal
- **Backend:** `Ctrl+C` in the backend terminal
- **Ollama:** `Ctrl+C` if you started it manually, or leave it running (it's lightweight)

---

## Seeding sample data (first run)

If you're starting fresh and want some restaurants and users already in the database so there's something to explore:

```bash
cd yelp-prototype/backend

source ../env/bin/activate

python seed_data.py
```

This creates a handful of users (regular + owner), restaurants across different cuisines, reviews, preferences, and favorites so the app feels populated right away. Safe to run multiple times — it checks for duplicates before inserting.

---

## Quick troubleshooting

| Symptom | Most likely cause | Fix |
|---|---|---|
| AI assistant shows "Template reply" badge | Ollama not running or wrong model | Run `ollama serve` and confirm `ollama list` shows `llama3.2:3b` |
| Backend won't start | venv not activated | `source ../env/bin/activate` |
| `ModuleNotFoundError` | Package not installed in venv | `pip install <package>` with venv active |
| Login loop / "Could not validate credentials" | Old token with wrong format | Clear localStorage in browser dev tools and log in again |
| Frontend shows blank page | Backend not running | Start the backend first |
| Port 8000 in use | Another process has it | `kill -9 $(lsof -t -i:8000)` |

---

## Tech stack at a glance

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | FastAPI, SQLAlchemy, MySQL, JWT auth |
| AI Assistant | LangChain + Ollama (`llama3.2:3b`) |
| Database | MySQL 8.0 |
