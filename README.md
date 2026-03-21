# Enterprise Feature Flag & Bayesian Experimentation Platform

A backend-heavy platform for running feature flags and A/B experiments with real-time traffic optimization using Thompson Sampling. Built as a polyglot system — Node.js handles the API layer, Python runs the ML optimization.

## Why I built this

I wanted something deeper than a typical CRUD project. Most "portfolio projects" are just REST wrappers around a database. This one actually solves real problems — deterministic user bucketing, stateful experiment lifecycles, real-time metrics aggregation, and Bayesian optimization of traffic allocation.

The goal was to build something I could actually explain in an interview without just saying "I made an API that does CRUD."

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     React Dashboard (:5174)                  │
│              Login · Experiments · Variants · Metrics         │
└──────────────────────┬───────────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼───────────────────────────────────────┐
│                   Node.js API (:3000)                         │
│                                                               │
│  Auth (JWT + bcrypt)    Experiments CRUD    Variants CRUD     │
│  State Machine          Event Ingestion    Metrics Aggregation│
│  Deterministic Hashing  Redis Caching      Cache Invalidation │
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

**Backend API:** Node.js, Express v4, PostgreSQL (raw SQL, no ORM), Redis, JWT, bcrypt

**ML Service:** Python, FastAPI, NumPy, SciPy (Beta distribution for Thompson Sampling)

**Frontend:** React (Vite), vanilla CSS

## What's actually interesting here

### Deterministic User Assignment
Users get assigned to variants using SHA-256 hashing — `hash(experimentId + userId) % 100` gives a stable bucket number. No database lookup needed, no sessions, completely stateless. The same user always lands in the same bucket.

### State Machine for Experiment Lifecycle
Experiments follow a strict `draft → running → paused → ended` lifecycle. The state machine prevents illegal transitions (you can't go from `ended` back to `draft`). Variants can only be modified in `draft` status.

### Pre-Aggregated Metrics
Instead of running expensive `COUNT(*)` queries on the events table every time someone opens the dashboard, I built a pre-aggregation step. Raw events get crunched into a `metrics` table using `INSERT ... ON CONFLICT DO UPDATE`. The dashboard reads from the pre-computed snapshot.

### Thompson Sampling (the ML part)
The Python service implements multi-armed bandit optimization. For each variant, it models the conversion rate as a Beta distribution (`Beta(1 + conversions, 1 + exposures - conversions)`), draws 10,000 Monte Carlo samples, and calculates how often each variant "wins." The winning probability becomes the new traffic weight.

### Service-to-Service Communication
The Node API and Python service talk over HTTP, authenticated with a shared API key (not JWT — there's no user session in service-to-service calls). When Python calculates new weights, it pushes them back to Node via a reverse callback, which updates the database inside a PostgreSQL transaction and invalidates the Redis cache.

## Project Structure

```
├── src/                          # Node.js backend
│   ├── configs/db.js             # PostgreSQL connection pool
│   ├── controllers/              # HTTP request handlers
│   ├── middlewares/              # JWT auth, role guard, API key
│   ├── migrations/               # Raw SQL schema files
│   ├── repositories/             # Database queries
│   ├── routes/                   # Express route definitions
│   ├── services/                 # Business logic layer
│   ├── utils/                    # State machine, hashing
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point
│
├── bandit-service/               # Python ML microservice
│   ├── main.py                   # FastAPI app + /optimize endpoint
│   ├── thompson.py               # Thompson Sampling algorithm
│   ├── schemas.py                # Pydantic request/response models
│   └── requirements.txt
│
├── dashboard/                    # React frontend
│   └── src/
│       ├── api.js                # API client with JWT handling
│       ├── pages/LoginPage.jsx
│       ├── pages/DashboardPage.jsx
│       └── pages/ExperimentPage.jsx
```

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- Redis

### 1. Backend (Node.js)

```bash
cd src
cp .env.example .env       # update DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migrate            # creates tables
npm run dev                # starts on :3000
```

### 2. ML Service (Python)

```bash
cd bandit-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Dashboard (React)

```bash
cd dashboard
npm install
npm run dev                # starts on :5174
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/experiments` | JWT | List all experiments |
| POST | `/experiments` | JWT (admin) | Create experiment |
| PATCH | `/experiments/:id/status` | JWT (admin) | Transition status |
| POST | `/experiments/:id/variants` | JWT (admin) | Add variant |
| POST | `/experiments/:id/assign` | — | Deterministic user assignment |
| POST | `/events` | — | Log exposure/conversion events |
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
BANDIT_API_KEY=your-internal-key
```

## Things I'd add with more time

- WebSocket for live dashboard updates when weights shift
- Dockerfile + docker-compose for one-command setup
- Statistical significance calculation (p-values alongside Bayesian)
- Multi-goal experiments (optimize for multiple conversion types)
- Audit log for who changed what and when
