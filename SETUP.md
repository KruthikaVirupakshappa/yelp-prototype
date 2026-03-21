# Fork & Fire — Fresh Environment Setup

This guide walks you through setting up everything from scratch on a new machine. Follow it top to bottom and you should be up and running without having to Google anything.

---

## What you'll need

- **Python 3.10 or newer** — the backend won't work on anything older
- **Node.js 18+** — for the frontend
- **MySQL 8.0+** — the main database
- **Ollama** — runs the AI assistant locally (no API key needed)
- A terminal and basic comfort with running commands

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/KruthikaVirupakshappa/yelp-prototype.git
cd yelp-prototype
```

---

## Step 2 — Set up the database

Make sure MySQL is running, then create the database:

```bash
mysql -u root -p < backend/init_db.sql
```

If you don't have a `root` password set, drop the `-p`. If your MySQL user is different, swap `root` for your username.

---

## Step 3 — Backend Python environment

Create a fresh virtual environment so packages don't conflict with anything else on your system:

```bash
cd backend

python3 -m venv ../env          # creates the venv one level up
source ../env/bin/activate      # activate it (on Windows: ..\env\Scripts\activate)
```

Now install everything:

```bash
pip install --upgrade pip

# Core backend
pip install fastapi uvicorn sqlalchemy pymysql cryptography
pip install python-jose[cryptography] passlib[bcrypt]
pip install pydantic pydantic-settings python-multipart

# LangChain + Ollama (for the AI assistant)
pip install langchain langchain-core langchain-ollama

# Optional: Tavily web search (only needed if you set TAVILY_API_KEY)
pip install tavily-python
```

> **Tip:** If you ever see `ModuleNotFoundError` when starting the server, make sure the venv is activated (`source ../env/bin/activate`) before running uvicorn.

---

## Step 4 — Configure the backend

Copy the example env file and fill in your details:

```bash
cp .env.example .env
```

Open `.env` and set these values:

```
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/yelp_db
SECRET_KEY=any_long_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Assistant — local Ollama (no key needed)
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434

# Optional extras (leave blank if you don't have them)
OPENAI_API_KEY=
TAVILY_API_KEY=
```

To generate a good SECRET_KEY you can run:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Step 5 — Install Ollama and pull the model

Ollama runs the AI assistant locally — no cloud account, no API bills.

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Download the installer from https://ollama.com

Once installed, pull the model the app uses:

```bash
ollama pull llama3.2:3b
```

This downloads about 2 GB, so grab a coffee. You only need to do this once.

Start Ollama (it usually runs as a background service automatically after install, but if not):

```bash
ollama serve
```

---

## Step 6 — Frontend

Open a new terminal tab (keep the backend one), then:

```bash
cd yelp-prototype/yelp-frontend

npm install
```

That's it — no extra config needed for the frontend.

---

## Step 7 — Verify everything works

Quick sanity check before starting:

```bash
# Check Python venv is active
python3 -c "import langchain_ollama; print('LangChain OK')"

# Check Ollama is running and has the model
ollama list   # should show llama3.2:3b

# Check Node
node --version   # should be 18+

# Check MySQL
mysql -u root -p -e "SHOW DATABASES;" | grep yelp_db
```

---

## Done!

Now head to [RUNNING.md](RUNNING.md) to start the app.
