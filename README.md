# AI-Powered SEO Optimization App

A full-stack web application with a conversational UI where authenticated users interact with an AI SEO assistant. Provide any URL and get instant, actionable SEO recommendations for title tags, meta descriptions, headings, and more.

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | Next.js 15, React 19, Tailwind CSS     |
| Backend        | NestJS 10, GraphQL (Apollo), TypeORM    |
| Database       | PostgreSQL 16                           |
| Authentication | Auth0                                   |
| AI             | Vercel AI SDK + Groq (Llama 3.3 70B, free tier) |

## Project Structure

```
ai-seo-optimization-app/
├── backend/                # NestJS GraphQL API
│   └── src/
│       ├── auth/           # Auth0 JWT guard
│       ├── user/           # User entity & service
│       ├── chat/           # Conversations & messages
│       └── seo-agent/      # AI SDK agent with tools
├── frontend/               # Next.js React app
│   └── src/
│       ├── app/            # Pages & API routes
│       ├── components/     # Chat UI components
│       └── lib/            # Apollo client & GraphQL
├── docker-compose.yml      # PostgreSQL
└── package.json            # Root scripts
```

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- Auth0 account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com), no credit card)

## Setup

### 1. Clone and install dependencies

```bash
npm install          # root (concurrently)
npm run install:all  # backend + frontend
```

### 2. Start PostgreSQL

```bash
npm run db:up
```

This starts a PostgreSQL 16 container on **port 5433** (host) with:
- User: `postgres`
- Password: `postgres`
- Database: `seo_optimizer`

**If you see "password authentication failed for user postgres"** when starting the backend:

- **Using Docker:** Ensure the container is running: `docker compose up -d` from the project root. Set `DB_PORT=5433` in `backend/.env` to match the mapped port.
- **Using a local PostgreSQL:** Set `DB_HOST`, `DB_PORT`, `DB_PASSWORD`, and if needed `DB_USERNAME` and `DB_NAME`, in `backend/.env` to match your instance. Create the database if needed: `createdb seo_optimizer`.

### 3. Configure Auth0

#### Create an Auth0 Application (for the frontend)

1. Go to [Auth0 Dashboard](https://manage.auth0.com) → Applications → Create Application
2. Choose **Regular Web Application**
3. In Settings, set:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Note your **Domain**, **Client ID**, and **Client Secret**

#### Create an Auth0 API (for the backend)

1. Go to Auth0 Dashboard → APIs → Create API
2. Set **Identifier** to `https://api.seo-optimizer.com` (or any URI you prefer)
3. Set **Signing Algorithm** to RS256

### 4. Configure environment variables

#### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=seo_optimizer
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.seo-optimizer.com
GROQ_API_KEY=gsk_...
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

#### Frontend

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local`:

```
AUTH0_SECRET=<generate-a-32+-character-random-string>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=<from-auth0-application>
AUTH0_CLIENT_SECRET=<from-auth0-application>
AUTH0_AUDIENCE=https://api.seo-optimizer.com
AUTH0_SCOPE=openid profile email
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

> Generate AUTH0_SECRET with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 5. Start the application

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000/graphql (with GraphQL Playground)

## Usage

1. Open http://localhost:3000
2. Click **Get Started** or **Log in** to authenticate via Auth0
3. Paste a URL (e.g., `https://example.com`) in the chat input
4. The AI agent will fetch the page, analyze its SEO elements, and provide:
   - Current title tag analysis with optimized suggestion
   - Meta description evaluation
   - Heading structure review
   - Open Graph tag assessment
   - Image alt attribute check
5. Ask follow-up questions to refine your SEO strategy

## Architecture

```
Browser ──► Next.js (Auth0 session) ──► NestJS GraphQL API
                                              │
                                  ┌───────────┼───────────┐
                                  │           │           │
                              Auth Guard   TypeORM    SEO Agent
                              (JWT)       (Postgres)  (AI SDK)
                                                        │
                                                   ┌────┴────┐
                                                   │         │
                                                  GPT    fetchPage
                                                4o-mini    tool
```

- **Auth flow**: Auth0 manages login/signup → Next.js stores session in encrypted cookie → Access token sent with GraphQL requests → NestJS validates JWT via Auth0 JWKS
- **Chat flow**: User sends message → NestJS saves it → SEO Agent processes with AI SDK → Tool fetches and extracts page SEO data → AI generates recommendations → Response saved and returned
- **Data**: TypeORM with `synchronize: true` auto-creates tables on startup (development only)

## Available Scripts

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start both frontend and backend       |
| `npm run dev:backend`| Start only the NestJS backend         |
| `npm run dev:frontend`| Start only the Next.js frontend      |
| `npm run db:up`      | Start PostgreSQL container            |
| `npm run db:down`    | Stop PostgreSQL container             |
| `npm run install:all`| Install deps for backend and frontend |
