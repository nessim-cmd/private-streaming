# PrivateLive

PrivateLive is a private live-streaming platform built with Next.js, LiveKit, Clerk, and Prisma.

Hosts can create rooms, go live, invite participants, approve or reject join requests, and chat in real time with persistent room message history.

## Features

- Private rooms with host ownership
- Real-time video and chat with LiveKit
- Host-controlled participant approval and rejection
- In-room sharing (invite links, QR code, email)
- Persistent room chat history via PostgreSQL + Prisma
- Responsive UI (mobile and desktop)
- PWA support (installable app)

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Clerk authentication
- LiveKit (SFU + tokens)
- Prisma + PostgreSQL
- Resend (email invites)
- Tailwind CSS + Framer Motion

## Project Structure

```text
app/                    # App Router pages and API routes
components/             # UI and feature components
lib/                    # Shared services (db, livekit, resend)
prisma/                 # Prisma schema and migrations
public/                 # Static assets + service worker
```

## Prerequisites

Before running locally, make sure you have:

- Node.js 20+
- npm 10+
- Docker Desktop (for local PostgreSQL via docker-compose)
- A Clerk application
- A LiveKit Cloud project (or self-hosted LiveKit)
- A Resend API key (for invite emails)

## Step-by-Step Local Setup

### 1. Clone repository

```bash
git clone https://github.com/nessim-cmd/private-streaming.git
cd private-streaming
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 4. Start PostgreSQL with Docker

```bash
docker compose up -d
```

By default, this runs PostgreSQL at `localhost:5433`.

### 5. Prepare Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Run development server

```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables

See `.env.example` for the complete list.

Required variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`

Recommended extras:

- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

## Common Commands

```bash
npm run dev      # start local dev server
npm run lint     # run ESLint
npm run build    # production build
npm run start    # run production server
```

## Deploy to Vercel

1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Add all environment variables from `.env.example` in Vercel Project Settings.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain.
5. Deploy.

## Troubleshooting

### Build fails with environment errors

- Verify all required env vars are present in `.env` (local) or Vercel (production).

### Cannot join room as participant

- Participant must be signed in.
- Host must approve request first.
- If rejected, participant will see a rejection message and cannot enter.

### Invite says sent but not received

- Check Resend domain verification and sender address.
- Check spam folder and mail provider filtering.

## Security Notes

- Never commit real secrets to Git.
- Keep `LIVEKIT_API_SECRET`, `CLERK_SECRET_KEY`, and `RESEND_API_KEY` server-only.
- Rotate keys immediately if they are exposed.

## License

This project is private and intended for internal use unless stated otherwise.
