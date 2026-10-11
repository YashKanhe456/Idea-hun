# IdeaHub — Backend

A FastAPI backend for the IdeaHub platform connecting student ideas with companies.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `idea_hub` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000` |

### Example `.env`

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=idea_hub
CORS_ORIGINS=http://localhost:3000
```

## MongoDB Setup

The application requires a running MongoDB instance. For local development:

```bash
# Using MongoDB locally
mongod --dbpath ./data

# Or using Docker
docker run -d -p 27017:27017 --name mongo mongo:latest
```

The connection string in `MONGO_URL` must point to your MongoDB instance.

## CORS Configuration

`CORS_ORIGINS` must include the frontend URL(s) that will call the API.

- Local development: `http://localhost:3000`
- Multiple origins: `http://localhost:3000,https://yourdomain.com`

**Important:** If `CORS_ORIGINS` is not set or empty, the server defaults to allowing **no origins** (security-first behavior). The app will not work until you configure at least one origin.

## Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run with uvicorn
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Important Limitations

This is an **incomplete student project**. Known limitations:

- **No authentication/authorization** — Users are identified by client-provided IDs stored in localStorage. There is no real auth, password hashing, or session management. Do not use in production.
- **No tests** — The `tests/` directory is empty.
- **No rate limiting** — Endpoints accept unlimited requests.
- **No production deployment configuration** — No Docker, CI/CD, or deployment scripts.

See `server.py` for a full list of incomplete features documented in the module docstring.
