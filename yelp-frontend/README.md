# Yelp Prototype

A full-stack Yelp-style restaurant discovery and review platform built using FastAPI (backend) and React with Vite (frontend).

This project includes authentication, profile management, restaurant search, reviews, favorites, and an AI-based recommendation assistant.

TECH STACK

Backend:
- FastAPI
- SQLAlchemy
- SQLite
- JWT Authentication
- Uvicorn

Frontend:
- React (Vite)
- Axios
- React Router
- LocalStorage for token handling


RUNNING THE BACKEND

From the project root:

source .venv/bin/activate
cd backend
uvicorn main:app --reload --port 8000

Backend URL:
http://127.0.0.1:8000

Swagger Docs:
http://127.0.0.1:8000/docs

RUNNING THE FRONTEND

cd yelp-frontend
npm install
npm run dev

Frontend URL:
http://localhost:5173

FEATURES IMPLEMENTED

Authentication:
- User signup
- User login
- JWT token validation
- Protected routes

Profile:
- View profile
- Update user information
- Update AI preferences

Restaurants:
- Create restaurant
- Search restaurants
- View restaurant details

Reviews:
- Create review
- Update review
- Delete review
- View review history

Favorites:
- Add to favorites
- Remove from favorites
- View saved restaurants

AI Assistant:
- Connected to /api/ai-assistant/chat
- Returns assistant reply
- Returns restaurant recommendations
- Recommendations navigate to restaurant details

AUTHENTICATION NOTES

- Login returns a JWT token.
- Token is stored in localStorage.
- If token expires, log in again.
- The SQLite database (yelp.db) is local and not pushed to GitHub.

STATUS

Frontend and backend are fully integrated and tested locally.

Core functionality confirmed working:
- Authentication
- Favorites
- Reviews
- Profile updates
- AI assistant integration