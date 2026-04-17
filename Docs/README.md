# 🎥 PrivateLive — Private Live Streaming Rooms App

A web application that allows users to create private live streaming rooms and invite people via link, email, or QR code.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Streaming | LiveKit |
| Database | PostgreSQL |
| ORM | Prisma |
| Email | Resend |
| QR Code | qrcode.react |
| Deployment | Vercel |
| Mobile | PWA |

---

## 🎯 What It Does

- User signs up / logs in via Clerk
- Creates a private live room (LiveKit)
- Gets a shareable link + QR code
- Invites guests via email
- Host streams video/audio live
- Guests watch in real-time
- Host ends the stream

---

## 📁 Project Structure

```
privateLive/
├── app/
│   ├── (auth)/              # Clerk auth pages
│   ├── dashboard/           # Host dashboard
│   ├── room/[id]/           # Live room page
│   └── api/
│       ├── rooms/           # Room CRUD
│       ├── livekit/         # LiveKit token generation
│       └── invite/          # Email invitations
├── components/
│   ├── LiveRoom/            # LiveKit video components
│   ├── QRCode/              # QR code display
│   └── Dashboard/           # Host controls
├── lib/
│   ├── livekit.ts           # LiveKit server utils
│   ├── db.ts                # Prisma client
│   └── resend.ts            # Email client
├── prisma/
│   └── schema.prisma        # DB schema
└── public/
    └── manifest.json        # PWA manifest
```

---

## 🛠 Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourname/privateLive.git
cd privateLive

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in all keys (see .env.example)

# 4. Start PostgreSQL with Docker
docker compose up -d

# 5. Push database schema
npx prisma db push

# 6. Run dev server
npm run dev
```

---

## 🔑 Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=

# LiveKit
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/privatelive?schema=public

# Resend (email)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 Development Phases

See `TODO.md` for detailed task breakdown per phase.

| Phase | Status |
|---|---|
| Phase 1 — Core MVP | 🔲 Not started |
| Phase 2 — Sharing System | 🔲 Not started |
| Phase 3 — Interaction (Chat) | 🔲 Not started |
| Phase 4 — Professional Features | 🔲 Not started |

---

## 🧭 Latest Update (2026-04-16)

- Added Clerk request proxy in `proxy.ts`.
- Updated app root layout with `ClerkProvider`, auth buttons, and `UserButton` in `app/layout.tsx`.
- Added auth pages:
    - `app/sign-in/[[...sign-in]]/page.tsx`
    - `app/sign-up/[[...sign-up]]/page.tsx`
- Added Docker PostgreSQL setup in `docker-compose.yml` (Postgres 16, persistent volume, port `5432`).

## 🧭 Latest Update (2026-04-17)

- Centered Clerk auth cards on:
    - `app/sign-in/[[...sign-in]]/page.tsx`
    - `app/sign-up/[[...sign-up]]/page.tsx`
- Installed Prisma ORM packages (`prisma`, `@prisma/client`) and added `zod`.
- Added Prisma setup:
    - `prisma/schema.prisma`
    - `prisma.config.ts` (Prisma 7 datasource config)
    - `lib/db.ts` (Prisma singleton)
- Added Clerk webhook endpoint to sync users into PostgreSQL:
    - `app/api/webhooks/clerk/route.ts`
- Updated project PostgreSQL port to `5433` because local `5432` is occupied by another running container.
- Fixed Prisma runtime for webhook route by using generated client output + PostgreSQL adapter (`@prisma/adapter-pg`).
- Added ESLint ignore for generated Prisma client (`generated/**`).
- Important: for local Clerk webhooks, use a public tunnel URL (localhost endpoints are not reachable from Clerk cloud).
- Milestone decision: authentication + webhook sync is marked complete for now, and final end-to-end webhook delivery validation will be done after Vercel deployment using the production URL in Clerk.
- Added LiveKit server utilities in `lib/livekit.ts`:
    - `generateToken(roomName, identity, isHost)`
    - `getRoomServiceClient()`
- Added Room APIs:
    - `app/api/rooms/route.ts` (`POST` create room, `GET` host rooms)
    - `app/api/rooms/[id]/route.ts` (`GET` single room)
    - `app/api/rooms/[id]/end/route.ts` (`POST` end room)
- Added LiveKit token API:
    - `app/api/livekit/token/route.ts` (`POST` token generation for host/guest)
- Installed required dependencies for this phase:
    - `livekit-server-sdk`, `uuid`, `@types/uuid`
- Aligned LiveKit environment handling to support `LIVEKIT_URL` (with fallback to `NEXT_PUBLIC_LIVEKIT_URL`).

---

## 📄 Documentation

- `ARCHITECTURE.md` — System design, data flow, component breakdown
- `RULES.md` — Code conventions, naming, folder structure rules
- `AGENT.md` — AI agent instructions for working on this codebase
- `TODO.md` — Full task list per phase
