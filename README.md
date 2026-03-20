# JLearn — Modern E-Learning Platform

Built on **Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript**.

## Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Auth | NextAuth.js v5 beta.19 — Google OAuth |
| Database | MongoDB Atlas + Mongoose |
| Cache | Upstash Redis |
| Media | Cloudinary |
| Payments | Stripe Checkout |
| AI Tutor | Anthropic Claude |

## Features
- Google OAuth sign-in (no passwords)
- Course catalogue with full-text search + filters
- Video player with progress tracking and resume
- AI Tutor (Claude) — 20 questions/hour per user
- Timestamped notes per lesson
- Interactive quiz engine with scoring and explanations
- Certificates on course completion
- Student dashboard: streak, XP, analytics
- Instructor studio: course builder + Cloudinary video/image uploads
- Stripe one-time payments + webhook fulfillment
- Dark / Light / System theme
- Role-based middleware (student / instructor / admin)

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# fill in your credentials
npm run seed
npm run dev
```

Open http://localhost:3000

## Environment Variables (.env.local.example)

### Google OAuth
- https://console.cloud.google.com → Credentials → OAuth 2.0
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

### MongoDB Atlas  
- https://cloud.mongodb.com → Free cluster → connect string → MONGODB_URI

### Upstash Redis
- https://console.upstash.com → REST API keys

### Cloudinary
- https://cloudinary.com/console
- Create unsigned upload preset: `jlearn_uploads`

### Stripe
- https://dashboard.stripe.com → API keys
- Local webhooks: `stripe listen --forward-to localhost:3000/api/payments/webhook`

### Anthropic
- https://console.groq.com → API Keys

## Project Structure

```
app/
  api/            API routes (auth, courses, progress, quiz, payments, AI, upload)
  courses/        Browse + detail pages
  dashboard/      Student dashboard (overview, courses, AI tutor, analytics, settings)
  learn/[slug]/   Video player with AI tutor + notes + quiz
  instructor/     Instructor studio
  login/          Google OAuth page
lib/              Auth, DB, Redis, Cloudinary, utilities
models/           Mongoose schemas (User, Course, Enrollment, Progress, Quiz, Certificate)
components/       React components (Navbar, CourseCard, AITutorPanel, QuizModule, etc.)
middleware.ts     Role-based route protection
scripts/seed.ts   Sample data seeder
```
