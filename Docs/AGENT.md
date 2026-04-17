# 🤖 AGENT.md — AI Agent Instructions for PrivateLive

This file is the primary context document for any AI coding agent (Copilot, Claude, Cursor, etc.) working on this codebase. Read this before writing any code.

---

## What This Project Is

**PrivateLive** — A Next.js full-stack web app for private live streaming. Users create private rooms, share a link or QR code, and stream live video/audio to invited guests.

---

## Tech Stack (Strict — Do Not Substitute)

| Concern | Tool |
|---|---|
| Framework | Next.js 14, App Router |
| Auth | Clerk |
| Live Streaming | LiveKit (`livekit-server-sdk` + `@livekit/components-react`) |
| Database | PostgreSQL via Prisma ORM |
| Email | Resend |
| QR Code | `qrcode.react` |
| Styling | Tailwind CSS |
| Validation | Zod |
| Deployment | Vercel |

---

## Current Development Phase

> Update this section every time you complete a phase.

**Active Phase:** Phase 1 — Core MVP  
**Status:** 🔲 Not started

---

## Project File Map

Before writing code, understand these key files:

```
prisma/schema.prisma       → DB models (Room, User, Invitation, Participant)
lib/livekit.ts             → Token generation + room service helpers
lib/db.ts                  → Prisma client singleton
lib/resend.ts              → Email sending helper
app/api/rooms/route.ts     → Create room (POST), list rooms (GET)
app/api/rooms/[id]/route.ts → Get room (GET), end room (POST /end)
app/api/livekit/token/route.ts → Generate LiveKit JWT
app/api/invite/route.ts    → Send email invitation
app/room/[id]/page.tsx     → Live room page (public)
app/dashboard/page.tsx     → Host dashboard (protected)
middleware.ts              → Clerk auth middleware
```

---

## Rules Agent Must Follow

1. **Read `RULES.md` before writing any component or API route.**
2. **Never use `any` type in TypeScript.**
3. **All API input must be validated with Zod.**
4. **Token generation is always server-side.** Never put `LIVEKIT_API_SECRET` in client code.
5. **Never write raw SQL.** Use Prisma.
6. **`"use client"` only when strictly necessary** (hooks, browser APIs, interactivity).
7. **One component per file. Max 200 lines per component.**
8. **Do not add features from Phase 2+ while Phase 1 is incomplete.**
9. **Always check `room.isActive` before rendering room content.**
10. **Guest token:** `canPublish: false`. **Host token:** `canPublish: true`.

---

## How to Generate a LiveKit Token

```ts
// Always in a server-side route handler
import { generateToken } from '@/lib/livekit';

// In POST /api/livekit/token
const token = generateToken(livekitRoomId, userIdentity, isHost);
return Response.json({ token });
```

---

## How to Create a Room

```ts
// POST /api/rooms
// 1. Validate input with Zod
// 2. Generate a UUID for liveKitRoomId
// 3. Create LiveKit room via RoomServiceClient
// 4. Save to DB via Prisma
// 5. Return { id, shareableLink }
```

---

## How to End a Room

```ts
// POST /api/rooms/[id]/end
// 1. Verify caller is the host (Clerk session)
// 2. Delete LiveKit room via RoomServiceClient
// 3. Update DB: isActive = false, endedAt = now()
```

---

## Room Page Logic (`/room/[id]`)

```
1. Fetch room by ID (server component or useEffect)
2. If room.isActive === false → render <StreamEnded /> component
3. If active:
   a. POST /api/livekit/token (client-side, after page loads)
   b. Connect to LiveKit using token
   c. If host → publish tracks (camera, mic)
   d. If guest → subscribe only
4. Show participant counter
5. Host sees "End Live" button
```

---

## What NOT to Build Yet (Phase 2+)

- Live chat
- Guest microphone/camera
- Password-protected rooms
- Stream recording
- Screen sharing
- Push notifications
- Scheduled rooms
- Analytics

---

## Phase Completion Checklist

Before marking a phase as done, verify:

### Phase 1 Checklist
- [ ] Clerk auth works (sign up, login, logout)
- [ ] Host can create a room
- [ ] Room is stored in DB with correct fields
- [ ] Shareable link is generated
- [ ] QR code is shown on room creation
- [ ] Guest can open `/room/[id]` and watch
- [ ] Host video/audio streams to guests
- [ ] Host can end the stream
- [ ] Room marked inactive in DB on end

### Phase 2 Checklist
- [ ] Host can enter email and send invite
- [ ] Email received with correct link
- [ ] Invitation stored in DB
- [ ] Host dashboard shows participant list
- [ ] Participant counter shown in room

---

## Agent Behavior Guidelines

- When adding a new API route: always create the Zod schema first, then the handler.
- When adding a new component: define the props interface first, then the JSX.
- When modifying the DB schema: run `npx prisma migrate dev --name <description>` after changes.
- When unsure about a feature scope: check `TODO.md` for the current phase tasks.
- Never delete a migration file.
- Always update `TODO.md` when a task is completed.
