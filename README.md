# Enterprise Feature Flag & Bayesian Experimentation Platform

A backend-heavy platform for running feature flags and A/B experiments with real-time traffic optimization using Thompson Sampling. Built as a polyglot system — Node.js handles the API layer, Python runs the ML optimization.

## Why I built this

I wanted something deeper than a typical CRUD project. Most "portfolio projects" are just REST wrappers around a database. This one actually solves real problems — deterministic user bucketing, stateful experiment lifecycles, real-time metrics aggregation, and Bayesian optimization of traffic allocation.

The goal was to build something I could actually explain in an interview without just saying "I made an API that does CRUD."

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     React Dashboard (:5173)                   │
│              Login · Experiments · Variants · Metrics          │
│              React Router · JWT decode · Auto-logout           │
└──────────────────────┬───────────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼───────────────────────────────────────┐
│                   Node.js API (:3000)                         │
│                                                               │
│  Auth (JWT + bcrypt)    Experiments CRUD    Variants CRUD     │
│  State Machine          Event Ingestion    Metrics Aggregation│
│  Deterministic Hashing  Redis Caching      Cache Invalidation │
│  Rate Limiting          Role-Based Access  Structured Logging │
│                                                               │
│  ┌─────────────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │  PostgreSQL      │  │  Redis    │  │ Internal API     │   │
│  │  (persistence)   │  │  (cache)  │  │ (API key auth)   │   │
│  └─────────────────┘  └───────────┘  └────────┬─────────┘   │
└──────────────────────────────────────────────────┬────────────┘
                                                   │ HTTP
┌──────────────────────────────────────────────────▼────────────┐
│                Python FastAPI Service (:8000)                  │
│                                                               │
│  Thompson Sampling (Beta Distribution + Monte Carlo)          │
│  scipy.stats.beta · numpy · 10K simulations per request       │
└───────────────────────────────────────────────────────────────┘
```

## Tech Stack

**Backend API:** Node.js, Express v4, PostgreSQL (raw SQL, no ORM), Redis, JWT, bcrypt, Pino logging, express-rate-limit

**ML Service:** Python, FastAPI, NumPy, SciPy (Beta distribution for Thompson Sampling)

**Frontend:** React (Vite), React Router, vanilla CSS

**Infrastructure:** Docker, docker-compose, nginx

**Testing:** Jest (Node.js), Pytest (Python) — 45 tests across both services

## What's actually interesting here

### Deterministic User Assignment
Users get assigned to variants using SHA-256 hashing — `hash(experimentId + userId) % 100` gives a stable bucket number. No database lookup needed, no sessions, completely stateless. The same user always lands in the same bucket.

### State Machine for Experiment Lifecycle
Experiments follow a strict `draft → running → paused → ended` lifecycle. The state machine prevents illegal transitions (you can't go from `ended` back to `draft`). Variants can only be modified in `draft` status. Starting an experiment requires at least 2 variants with weights summing to exactly 100.

### Pre-Aggregated Metrics
Instead of running expensive `COUNT(*)` queries on the events table every time someone opens the dashboard, I built a pre-aggregation step. Raw events get crunched into a `metrics` table using `INSERT ... ON CONFLICT DO UPDATE`. The dashboard reads from the pre-computed snapshot.

### Thompson Sampling (the ML part)
The Python service implements multi-armed bandit optimization. For each variant, it models the conversion rate as a Beta distribution (`Beta(1 + conversions, 1 + exposures - conversions)`), draws 10,000 Monte Carlo samples, and calculates how often each variant "wins." The winning probability becomes the new traffic weight.

### Service-to-Service Communication
The Node API and Python service talk over HTTP, authenticated with a shared API key using constant-time comparison (not JWT — there's no user session in service-to-service calls). When Python calculates new weights, it pushes them back to Node via a reverse callback, which updates the database inside a PostgreSQL transaction and invalidates the Redis cache.

### Security
- Passwords validated for strength (8+ chars, letters + numbers)
- Rate limiting on auth endpoints (5 login attempts / 15 min)
- Role-based access: users register as `viewer` by default; only existing admins can promote
- API key authentication for runtime and internal endpoints with timing-safe comparison
- Graceful shutdown with connection draining

## Project Structure

```
├── src/                          # Node.js backend
│   ├── configs/                  # DB pool, Redis client, Pino logger
│   ├── controllers/              # HTTP request handlers
│   ├── middlewares/              # JWT auth, role guard, API key (timing-safe)
│   ├── migrations/               # Raw SQL schema files + tracked runner
│   ├── repositories/             # Database queries
│   ├── routes/                   # Express route definitions
│   ├── services/                 # Business logic layer
│   ├── utils/                    # State machine, hashing
│   ├── __tests__/                # Jest unit tests
│   ├── seed.js                   # Demo data seeder
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point + graceful shutdown
│
├── bandit-service/               # Python ML microservice
│   ├── main.py                   # FastAPI app + /optimize endpoint
│   ├── thompson.py               # Thompson Sampling algorithm
│   ├── schemas.py                # Pydantic request/response models
│   ├── test_thompson.py          # Pytest tests
│   └── requirements.txt
│
├── dashboard/                    # React frontend
│   └── src/
│       ├── api.js                # API client with JWT handling + expiry check
│       ├── components/           # Layout, ProtectedRoute
│       ├── pages/                # Login, Dashboard, Experiment
│       └── index.css             # Dark theme styles
│
├── docker-compose.yml            # One-command full-stack setup
├── Makefile                      # make up, make migrate, make seed
└── README.md
```

## Quick Start

### Option 1: Docker (recommended)

```bash
make up          # Starts Postgres, Redis, API, Python service, Dashboard
make migrate     # Creates database tables
make seed        # Populates demo data (login: admin@experiment.io / Admin123)
```

Then open `http://localhost` for the dashboard.

### Option 2: Manual

#### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- Redis

#### 1. Backend (Node.js)

```bash
cd src
cp .env.example .env       # update DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migrate            # creates tables
npm run seed               # populates demo data
npm run dev                # starts on :3000
```

#### 2. ML Service (Python)

```bash
cd bandit-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 3. Dashboard (React)

```bash
cd dashboard
npm install
npm run dev                # starts on :5173
```

**Demo credentials:** `admin@experiment.io` / `Admin123`

## Running Tests

```bash
# Node.js tests (37 tests)
cd src && npm test

# Python tests (8 tests)
cd bandit-service && python -m pytest test_thompson.py -v
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register (always as viewer) |
| POST | `/auth/login` | — | Login, returns JWT |
| POST | `/auth/promote` | JWT (admin) | Promote user role |
| GET | `/experiments` | JWT | List all experiments |
| POST | `/experiments` | JWT (admin) | Create experiment |
| PATCH | `/experiments/:id/status` | JWT (admin) | Transition status |
| POST | `/experiments/:id/variants` | JWT (admin) | Add variant |
| POST | `/experiments/:id/assign` | API Key | Deterministic user assignment |
| POST | `/events` | API Key | Log exposure/conversion events |
| GET | `/experiments/:id/metrics` | JWT | Get aggregated metrics |
| POST | `/experiments/:id/optimize` | JWT (admin) | Trigger Thompson Sampling |

## Environment Variables

```
PORT=3000
DATABASE_URL=postgresql://localhost:5432/experiment_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-in-production
JWT_EXPIRY=24h
BANDIT_SERVICE_URL=http://127.0.0.1:8000
BANDIT_API_KEY=change-this-too
RUNTIME_API_KEY=                    # optional, protects assign/events endpoints
```

> **Note:** The repository directory name has a typo (`Featue_Flag_and_Experimentation`). If you clone it, consider renaming to `Feature_Flag_and_Experimentation`.
