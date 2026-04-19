# Chat App Backend

Standalone backend service for authentication, chat, and realtime features.

## Architecture

This project uses a modular architecture under `src/modules/*` with dedicated layers:
- `*.routes.js`: HTTP route definitions
- `*.controller.js`: Request/response orchestration
- `*.service.js`: Business logic
- `*.schema.js`: Zod request validation

Core setup:
- Express + MongoDB + Redis
- JWT authentication (access + refresh)
- Socket.io bootstrapped in `server.js`

Redis is optional for local or Render deployments. If `REDIS_URL` is not set, refresh-token persistence falls back to in-memory-only behavior for the current process.

## Getting Started

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

Server runs by default on `http://localhost:4000`.

## Production Security Notes

- Keep secrets only in backend environment variables (Render Environment settings), never in frontend source.
- Frontend `VITE_*` variables are public by design and should contain only public URLs (for example API/socket base URL), not secrets.
- Set `CLIENT_URL` to your primary frontend origin.
- If you have more than one frontend host (for example production + staging), set `CLIENT_URLS` as a comma-separated list of additional origins.
- Use `.env.example` as a template and keep real values in `.env` locally and in Render env vars.

## Auth APIs

Base path: `/api/auth`

- `POST /signup`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /refresh`
- `GET /me`
