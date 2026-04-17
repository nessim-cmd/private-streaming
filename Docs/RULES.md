# 📏 RULES.md — PrivateLive Code Conventions

These rules apply to all code in this project. Any contributor or AI agent must follow them strictly.

---

## 1. Framework Rules

- **Next.js App Router only.** No Pages Router. All routes live under `app/`.
- **Server Components by default.** Only add `"use client"` when the component requires browser APIs, hooks, or interactivity.
- **API routes = Route Handlers.** Use `app/api/*/route.ts` pattern. No `pages/api/`.

---

## 2. Folder Structure Rules

```
app/
  (auth)/             ← Clerk auth pages (sign-in, sign-up)
  dashboard/          ← Protected host dashboard
  room/[id]/          ← Public live room page
  api/
    rooms/            ← Room CRUD
    livekit/          ← Token generation only
    invite/           ← Email invitation sending
    webhooks/         ← Clerk webhooks

components/
  ui/                 ← Generic reusable UI (buttons, inputs, modals)
  LiveRoom/           ← LiveKit video/audio components
  Dashboard/          ← Host-specific components
  QRCode/             ← QR code display

lib/
  livekit.ts          ← LiveKit server utils (token, room service)
  db.ts               ← Prisma client singleton
  resend.ts           ← Email helper
  utils.ts            ← General utilities

prisma/
  schema.prisma       ← Single source of truth for DB schema
```

**Rule:** Never put business logic inside components. Components render UI only. Logic goes in `lib/` or API routes.

---

## 3. Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `RoomCard.tsx` |
| Hooks | camelCase + use prefix | `useRoomStatus.ts` |
| API routes | lowercase + hyphens | `route.ts` in `/api/livekit/token/` |
| DB models | PascalCase (Prisma) | `Room`, `User` |
| Variables | camelCase | `roomId`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_PARTICIPANTS` |
| Types/Interfaces | PascalCase + I prefix optional | `RoomData`, `InvitePayload` |

---

## 4. TypeScript Rules

- **Strict mode on.** No `any`. Use proper types everywhere.
- **No implicit returns.** All functions must have explicit return types.
- **Zod for all API input validation.** Never trust raw `req.body`.

```ts
// ✅ Correct
const schema = z.object({ name: z.string().min(1).max(100) });
const body = schema.parse(await req.json());

// ❌ Wrong
const body = await req.json();
```

---

## 5. Database Rules

- **Prisma only.** No raw SQL unless absolutely necessary.
- **Never expose DB IDs directly in URLs.** Use `cuid()` as primary keys (already set in schema).
- **Always check `isActive` before serving a room.**
- **Migrations:** Use `prisma migrate dev` for local, `prisma migrate deploy` for production.

---

## 6. Authentication Rules

- **Clerk handles all auth.** No custom session management.
- **All dashboard routes are protected** via Clerk middleware (`middleware.ts`).
- **Room join (`/room/[id]`) is public** — guests can join without login.
- **Token generation (`/api/livekit/token`) requires Clerk session** if user is host. Guest token can be anonymous.
- **Never expose `LIVEKIT_API_SECRET` or `CLERK_SECRET_KEY` to the client.**

---

## 7. LiveKit Rules

- **Token generation is always server-side.** Route: `POST /api/livekit/token`.
- **Host token:** `canPublish: true, canSubscribe: true`
- **Guest token:** `canPublish: false, canSubscribe: true`
- **Room names** = `liveKitRoomId` stored in DB (UUID format).
- **End stream** = delete LiveKit room via `RoomServiceClient` + update DB.

---

## 8. API Route Rules

- All routes return JSON.
- Use proper HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, `500`.
- Wrap all handlers in try/catch.
- Validate input with Zod before any DB call.

```ts
// Pattern for every route handler
export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    // logic
    return Response.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 9. Environment Variables Rules

- All secrets in `.env.local` (never committed).
- `.env.example` committed with empty values as reference.
- Client-side vars prefixed with `NEXT_PUBLIC_`.
- Never hardcode any URL, key, or secret.

---

## 10. Component Rules

- One component per file.
- No component file exceeds 200 lines. Extract sub-components if needed.
- Props must be typed with explicit interface.
- No inline styles. Use Tailwind CSS only.

---

## 11. Phase Discipline

- **Do not build Phase 2+ features while Phase 1 is incomplete.**
- Features must be fully working and tested before moving to the next phase.
- See `TODO.md` for phase breakdown.
