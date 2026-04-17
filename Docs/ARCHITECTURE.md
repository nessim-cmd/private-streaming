# 🏗 ARCHITECTURE.md — PrivateLive

## Overview

PrivateLive is a full-stack Next.js application. The architecture follows a clean separation: Next.js API routes handle all server-side logic, LiveKit manages real-time media, Clerk owns auth, and PostgreSQL (via Prisma) stores persistent state.

---

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT (Browser/PWA)             │
│                                                     │
│   ┌──────────┐   ┌──────────┐   ┌──────────────┐  │
│   │  Auth UI │   │Dashboard │   │  Room Page   │  │
│   │ (Clerk)  │   │  /dash   │   │ /room/[id]   │  │
│   └────┬─────┘   └────┬─────┘   └──────┬───────┘  │
└────────┼──────────────┼────────────────┼────────────┘
         │              │                │
         ▼              ▼                ▼
┌─────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (/api/*)             │
│                                                     │
│  /api/rooms       /api/livekit/token   /api/invite  │
│  (CRUD rooms)     (generate JWT)       (send email) │
└──────┬──────────────────┬──────────────────┬────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   LiveKit     │  │    Resend    │
│  via Prisma  │  │  Cloud/Self-  │  │   (Email)    │
│              │  │   hosted      │  │              │
└──────────────┘  └───────────────┘  └──────────────┘
```

---

## Authentication Flow (Clerk)

```
User opens app
    ↓
Clerk middleware checks session
    ↓
Not authenticated → redirect to /sign-in
    ↓
Authenticated → session available via useUser() / currentUser()
    ↓
Clerk user ID (clerk_id) stored in our DB on first login
```

**Webhook:** Clerk fires `user.created` → we create a record in `users` table.

---

## Room Creation Flow

```
Host clicks "Start Live"
    ↓
POST /api/rooms
    ├── Validate input (room name)
    ├── Create LiveKit room via LiveKit Server SDK
    │     roomName = uuid()
    ├── Store in DB:
    │     rooms { name, host_id, livekit_room_id, is_active: true }
    └── Return { roomId, shareableLink }
    ↓
Client shows:
    - Shareable link: /room/[id]
    - QR Code (generated client-side with qrcode.react)
```

---

## Join Room Flow

```
Guest opens /room/[id]
    ↓
Page loads → GET /api/rooms/[id] (check is_active)
    ↓
If inactive → show "Stream ended" screen
    ↓
If active:
    POST /api/livekit/token
        ├── identity = userId (or random guest ID)
        ├── room = livekit_room_id
        └── permissions:
              Host → canPublish: true, canSubscribe: true
              Guest → canPublish: false, canSubscribe: true
    ↓
LiveKit SDK connects to room using token
    ↓
Host → publishes camera + mic tracks
Guest → subscribes to tracks (watch only)
```

---

## End Stream Flow

```
Host clicks "End Live"
    ↓
POST /api/rooms/[id]/end
    ├── Delete LiveKit room via SDK
    └── DB update: is_active = false, ended_at = now()
    ↓
All participants disconnected by LiveKit
    ↓
Room page shows "Stream ended"
```

---

## Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  createdAt DateTime @default(now())

  rooms        Room[]
  participations Participant[]
}

model Room {
  id             String    @id @default(cuid())
  name           String
  hostId         String
  liveKitRoomId  String    @unique
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  endedAt        DateTime?

  host         User          @relation(fields: [hostId], references: [id])
  invitations  Invitation[]
  participants Participant[]
}

model Invitation {
  id        String   @id @default(cuid())
  roomId    String
  email     String
  status    String   @default("pending") // pending | accepted
  createdAt DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id])
}

model Participant {
  id       String    @id @default(cuid())
  roomId   String
  userId   String?
  joinedAt DateTime  @default(now())
  leftAt   DateTime?

  room Room  @relation(fields: [roomId], references: [id])
  user User? @relation(fields: [userId], references: [id])
}
```

---

## LiveKit Integration

- **Server SDK:** `livekit-server-sdk` — used in API routes to create/delete rooms and generate access tokens.
- **Client SDK:** `@livekit/components-react` — used in the Room page to render video/audio.
- **Token generation:** Always server-side (never expose API secret to client).

```ts
// lib/livekit.ts
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export function generateToken(roomName: string, identity: string, isHost: boolean) {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity }
  );
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isHost,
    canSubscribe: true,
  });
  return at.toJwt();
}
```

---

## Email (Resend)

```ts
// lib/resend.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvite(toEmail: string, roomLink: string, roomName: string) {
  await resend.emails.send({
    from: 'noreply@yourapp.com',
    to: toEmail,
    subject: `You're invited to: ${roomName}`,
    html: `<p>Join the live stream here: <a href="${roomLink}">${roomLink}</a></p>`,
  });
}
```

---

## PWA Setup

- `public/manifest.json` — app name, icons, theme color
- `next.config.js` — headers for service worker
- Optional: `next-pwa` package for automatic SW generation

---

## Deployment (Vercel)

- Connect GitHub repo to Vercel
- Set all env vars in Vercel dashboard
- Database: use Supabase, Neon, or Railway for hosted PostgreSQL
- LiveKit: use LiveKit Cloud (managed) or self-host on a VPS
