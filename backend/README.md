# Yelp Prototype - Backend (FastAPI + MySQL)

## Setup

### 1. Prerequisites
- Python 3.10+
- MySQL 8.0+

### 2. Create MySQL Database
```bash
mysql -u root -p < init_db.sql
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials, OpenAI key, and Tavily key
```

### 5. Run the Server
```bash
uvicorn main:app --reload --port 8000
```

### 6. If port 8000 is already in use, kill the existing session:
```bash
kill -9 $(lsof -t -i:8000)
```
Then restart the server using the command above.

### 7. API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user/owner |
| POST | `/api/auth/login` | Login and get JWT token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/users/me/profile-picture` | Upload profile picture |

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/restaurants/` | Create restaurant |
| GET | `/api/restaurants/` | Search restaurants (query params: name, cuisine_type, keywords, city, zip_code) |
| GET | `/api/restaurants/{id}` | Get restaurant details |
| PUT | `/api/restaurants/{id}` | Update restaurant |
| POST | `/api/restaurants/{id}/claim` | Claim restaurant (owners) |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/` | Create review |
| GET | `/api/reviews/restaurant/{id}` | Get restaurant reviews |
| PUT | `/api/reviews/{id}` | Update own review |
| DELETE | `/api/reviews/{id}` | Delete own review |
| GET | `/api/reviews/user/history` | Get user's review history |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/favorites/{restaurant_id}` | Add to favorites |
| DELETE | `/api/favorites/{restaurant_id}` | Remove from favorites |
| GET | `/api/favorites/` | List favorites |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences/` | Get user preferences |
| PUT | `/api/preferences/` | Update preferences |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-assistant/chat` | Chat with AI assistant |

### Owner Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/restaurants` | Get owned restaurants |
| GET | `/api/owner/restaurants/{id}/reviews` | Get reviews for owned restaurant |
| GET | `/api/owner/dashboard` | Get dashboard analytics |