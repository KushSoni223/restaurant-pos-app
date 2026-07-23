# Restaurant POS API

FastAPI backend for the Restaurant POS mobile app. Layered architecture with thin routes, services, repositories, and async SQLAlchemy.

## Project structure

```
backend/
├── app/
│   ├── main.py                 # Uvicorn entry point
│   ├── factory.py              # create_app() factory
│   ├── api/
│   │   ├── deps.py             # Shared Depends() helpers
│   │   └── v1/
│   │       ├── router.py       # Aggregates all v1 routes
│   │       └── endpoints/      # HTTP handlers (one file per domain)
│   ├── core/                   # Config, security, exceptions, middleware
│   ├── db/                     # Async engine, session, base model
│   ├── models/                 # SQLAlchemy ORM models
│   ├── schemas/                # Pydantic request/response models
│   ├── repositories/           # Data access layer
│   └── services/               # Business logic
├── alembic/                    # Database migrations
├── docker/                     # Dockerfile + docker-compose
└── tests/
    ├── unit/
    └── integration/
```

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env with your values

# Start PostgreSQL (optional, via Docker)
docker compose -f docker/docker-compose.yml up -d db

# Run migrations (after you add models)
alembic upgrade head

# Seed default admin (admin@gmail.com / Test@123)
python scripts/seed_admin.py

# Seed menu categories + items (needed for chef areas & ordering)
python scripts/seed_menu.py

# Start API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

## API domains (scaffolded)

| Prefix | Domain |
|--------|--------|
| `/api/v1/auth` | Login, tokens, current user |
| `/api/v1/menu` | Categories, menu items |
| `/api/v1/orders` | Order lifecycle |
| `/api/v1/tables` | Table management |
| `/api/v1/payments` | Billing & payments |
| `/api/v1/kitchen` | Chef / KDS queue |
| `/api/v1/staff` | Staff & roles (admin) |

> The Expo app currently calls `/auth/login`. A legacy alias is mounted at `/auth` until you update the mobile client to `/api/v1/auth`.

## Development

```bash
# Lint
ruff check app tests

# Tests
pytest
```
