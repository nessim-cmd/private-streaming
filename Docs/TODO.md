# ✅ TODO.md — PrivateLive Task Tracker

> **Legend:** 🔲 Not started | 🔄 In progress | ✅ Done | ❌ Blocked

---

## Phase 1 — Core MVP

> Goal: First working live stream from host to guest.

### 1.1 — Project Setup
- 🔲 Init Next.js 14 project (`npx create-next-app@latest`)
- 🔲 Install dependencies:
  - `@clerk/nextjs`
  - `livekit-server-sdk`
  - `@livekit/components-react`
  - `@livekit/components-styles`
  - `prisma` + `@prisma/client`
  - `qrcode.react`
  - `resend`
  - `zod`
  - `uuid`
- 🔲 Set up `.env.local` with all keys
- ✅ Create `.env.example` with empty values
- 🔲 Configure `tailwind.config.ts`
- ✅ Set up `proxy.ts` (Clerk auth)

### 1.2 — Database
- ✅ Set up PostgreSQL instance (Docker local)
- ✅ Write `prisma/schema.prisma` (User, Room, Invitation, Participant)
- ✅ Run `npx prisma migrate dev --name init`
- ✅ Create `lib/db.ts` (Prisma singleton)

### 1.3 — Authentication (Clerk)
- ✅ Install and configure Clerk provider in `app/layout.tsx`
- ✅ Create `app/sign-in/[[...sign-in]]/page.tsx`
- ✅ Create `app/sign-up/[[...sign-up]]/page.tsx`
- ✅ Set up Clerk webhook (`app/api/webhooks/clerk/route.ts`) → create user in DB on `user.created`
- ✅ Test: sign up, login, logout (feature complete; final Clerk webhook delivery validation deferred to Vercel deployment URL)

### 1.4 — LiveKit Setup
- 🔲 Create LiveKit Cloud account (or self-host)
- 🔲 Store `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` in env
- ✅ Create `lib/livekit.ts`:
  - `generateToken(roomName, identity, isHost)` function
  - `getRoomServiceClient()` function

### 1.5 — Room Creation API
- ✅ Create `app/api/rooms/route.ts`:
  - `POST` → validate input, create LiveKit room, save to DB, return room data
  - `GET` → return all rooms for current host
- ✅ Create `app/api/rooms/[id]/route.ts`:
  - `GET` → return single room by ID (check isActive)
- ✅ Create `app/api/rooms/[id]/end/route.ts`:
  - `POST` → verify host, delete LiveKit room, set isActive=false

### 1.6 — LiveKit Token API
- ✅ Create `app/api/livekit/token/route.ts`:
  - `POST` → receive `{ roomId, identity, isHost }`, return JWT token
  - Guest: `canPublish: false`
  - Host: `canPublish: true`

### 1.7 — Dashboard (Host)
- 🔲 Create `app/dashboard/page.tsx` (protected route)
- 🔲 "Start Live" button → POST /api/rooms
- 🔲 Show created room card with:
  - Room name
  - Shareable link
  - QR code (`qrcode.react`)
  - Copy link button
- 🔲 Show list of host's rooms (active/past)

### 1.8 — Room Page (Guest + Host)
- 🔲 Create `app/room/[id]/page.tsx`
- 🔲 On load: fetch room data, check isActive
- 🔲 If inactive: show `<StreamEnded />` component
- 🔲 If active:
  - Fetch LiveKit token from `/api/livekit/token`
  - Connect to LiveKit room
  - Host view: `<LiveKitRoom>` with camera + mic controls
  - Guest view: video player only
- 🔲 Show participant counter
- 🔲 Host: show "End Live" button

### 1.9 — UI Components
- 🔲 `components/LiveRoom/VideoConference.tsx` — LiveKit video grid
- 🔲 `components/LiveRoom/HostControls.tsx` — camera/mic toggles + end button
- 🔲 `components/QRCode/RoomQRCode.tsx` — QR code display
- 🔲 `components/Dashboard/RoomCard.tsx` — room summary card
- 🔲 `components/ui/CopyButton.tsx` — copy to clipboard

### 1.10 — Phase 1 Testing
- 🔲 Host creates room → room appears in DB
- 🔲 Shareable link works
- 🔲 QR code is correct
- 🔲 Guest opens link → connects to stream
- 🔲 Host video visible to guest
- 🔲 Host ends stream → room inactive, guests disconnected

---

## Phase 2 — Sharing System

> Goal: Email invitations + participant tracking.

### 2.1 — Email Invitations
- 🔲 Create Resend account + verify domain
- 🔲 Create `lib/resend.ts` email helper
- 🔲 Create `app/api/invite/route.ts`:
  - `POST` → validate email + roomId, save Invitation to DB, send email via Resend
- 🔲 Add invite form to Dashboard room card
- 🔲 Design email template (HTML)
- 🔲 Test: invite sent, received, link works

### 2.2 — Participant Tracking
- 🔲 Record participant join/leave in DB via API or LiveKit webhooks
- 🔲 LiveKit webhook: `app/api/webhooks/livekit/route.ts`
  - Handle `participant_joined` → create Participant record
  - Handle `participant_left` → update leftAt
- 🔲 Show participants list in host dashboard (live update)
- 🔲 Show participant counter in room page

### 2.3 — Room Dashboard Improvements
- 🔲 Host dashboard shows full room details panel
- 🔲 List of sent invitations with status
- 🔲 Active room vs past rooms tabs

---

## Phase 3 — Interaction

> Goal: Real-time chat + guest microphone.

### 3.1 — Live Chat
- 🔲 Implement using LiveKit Data Channels
- 🔲 `components/LiveRoom/Chat.tsx` — chat panel
- 🔲 Messages: sender name + text + timestamp
- 🔲 Auto-scroll to latest message

### 3.2 — Guest Speaking
- 🔲 Host can grant/revoke mic permission to guests
- 🔲 Update LiveKit participant permissions server-side
- 🔲 `components/LiveRoom/GuestMicButton.tsx`
- 🔲 Host sees "Allow mic" button per participant

---

## Phase 4 — Professional Features

> Goal: Recording, screen sharing, scheduling.

### 4.1 — Screen Sharing
- 🔲 Host can share screen via LiveKit `createScreenTracks()`
- 🔲 Screen share toggle button in HostControls
- 🔲 Guest sees screen share stream

### 4.2 — Stream Recording
- 🔲 Use LiveKit Egress API to record rooms
- 🔲 Store recording URL in DB (new `recordings` table)
- 🔲 Host dashboard: "Past Recordings" section
- 🔲 Video playback page

### 4.3 — Scheduled Rooms
- 🔲 Room model: add `scheduledAt` field
- 🔲 Create room with future start time
- 🔲 Room page shows countdown if not yet started
- 🔲 Email reminder sent X minutes before start

### 4.4 — Security Hardening
- 🔲 Kick user: host can remove participant
- 🔲 Mute user: host mutes guest mic server-side
- 🔲 Optional room password (hashed in DB)
- 🔲 Rate limiting on API routes

---

## Backlog (No Phase Assigned)

- 🔲 PWA manifest + service worker setup
- 🔲 Mobile UI optimization (touch-friendly controls)
- 🔲 Custom room themes
- 🔲 Analytics: total viewers, peak viewers, watch time
- 🔲 Multiple regions (LiveKit Cloud handles this)
- 🔲 Reusable persistent rooms
- 🔲 Push notifications (Web Push API)

---

## Completed

> Move tasks here when done, with date.

- 2026-04-17: Clerk auth + webhook-to-PostgreSQL integration completed (final external webhook delivery verification deferred to deployed Vercel URL).
