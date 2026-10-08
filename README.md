# FixOnRoad

> FixOnRoad connects drivers to nearby verified mechanics for on-demand roadside assistance.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://fixonroad.vercel.app)
[![Repo](https://img.shields.io/badge/GitHub-Repo-black?style=for-the-badge&logo=github)](https://github.com/basakrupankar/fixonroad)

---

## Preview

| App Screenshot | Mobile |
|---|---|
| ![main](./docs/screenshots/desktop-dark.png) | ![mobile](./docs/screenshots/mobile-view.png) |

---

## What It Does

FixOnRoad solves the anxiety of vehicle breakdowns in the middle of nowhere by instantly connecting stranded drivers with professional mechanics. Built for both customers (riders/drivers) and verified service providers (mechanics), the platform handles everything from upfront pricing estimates to real-time location tracking and secure session-based authentication. Whether you have a flat tire, need a jumpstart, or require a tow truck, help is just a click away.

---

## Features

- **Secure Session-Based Auth** — Replaced OTP flow with robust `bcryptjs` email/password login and cryptographic random session cookies.
- **Role-Based Portals** — Distinct dashboards and workflows for Customers (requesting help) and Mechanics (accepting jobs and tracking earnings).
- **Internationalization (i18n)** — Complete multilingual support for English, Hindi, and Bengali across all pages and components.
- **Dynamic Services & Upfront Pricing** — Flat tire, battery jumpstarts, towing, and fuel delivery with transparent GST and platform fees.
- **Responsive 60fps Micro-interactions** — Built with Framer Motion, ensuring smooth UI interactions and loading states without layout repaints.

---

## Planning Docs

- [PRD](./docs/01-PRD.md)
- [Architecture](./docs/02-ARCHITECTURE.md)
- [API Spec](./docs/API_SPEC.md)
- [Roadmap](./docs/ROADMAP.md)

**Deviations from the plan:** We removed the original Phone OTP Twilio integration and transitioned entirely to a secure cookie-based session approach using standard Email/Password and Google OAuth, which ensures more robust session persistence during rapid page reloads on mobile networks.

---

## Architecture

```
Browser 
└── React (Vite / Vercel) 
    ├── /pages      (Auth, Services, Mechanic, Payment)
    ├── /context    (AuthContext handling secure cookies)
    ├── /api        (Express REST API routes on Render/Vercel Serverless)
    └── MongoDB Atlas (Users, Mechanics, Sessions)
```

The frontend uses Vite and React, communicating securely via standard HTTPS requests (`credentials: 'include'`) with an Express backend. The backend manages authentication using `bcryptjs` and session tokens, verifying requests via custom middleware before accessing MongoDB data.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React (Vite) | Extremely fast dev server, standard SPA approach |
| Backend | Node.js + Express | Lightweight, reliable REST API serving |
| Database | MongoDB Atlas | Flexible NoSQL schema, Mongoose ODM |
| Auth | Secure Cookies + bcryptjs | Bulletproof session persistence, no localstorage token theft |
| Styling | Tailwind + Framer Motion | Consistent, accessible, and easily animatable UI |
| Deployment | Vercel | Native continuous deployment, great caching |

---

## Database Schema

```sql
-- MongoDB Collections represented in standard schema format

users          (id, email, username, phone, password_hash, role, city, age, created_at)
sessions       (id, user_id → users.id, session_token, expires_at)
mechanics      (id, user_id → users.id, skills, is_verified, rating, total_jobs, created_at)
payments       (id, user_id → users.id, amount, service_id, status, created_at)
```

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Create user (hashed password) |
| POST | `/api/v1/auth/login` | Public | Sign in and set session cookie |
| POST | `/api/v1/auth/logout` | Required | Destroy session cookie |
| GET  | `/api/v1/me` | Required | Return current authenticated user |
| POST | `/api/v1/payments/cash-confirm` | Required | Process COD or UPI payment |

## Getting Started

```bash
git clone https://github.com/basakrupankar/fixonroad.git
cd fixonroad

# 1. Start the Backend
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev

# 2. Start the Frontend
cd ../client
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Where to Get |
|---|---|---|
| `MONGO_URI` | MongoDB Connection String | MongoDB Atlas Dashboard |
| `PORT` | Backend port (default 5000) | Local preference |
| `CLIENT_ORIGIN` | Allowed CORS origin | Frontend URL (e.g., `http://localhost:5173`) |
| `VITE_API_URL` | Base URL for API requests | Add to client's `.env` |

## Auth Flow

Provider: Standard Email/Password + Google OAuth
Sessions: Server-side cryptographic cookies generated via `crypto.randomBytes(32)`
Protected routes: Handled via `AuthContext` on the frontend and `requireAuth` middleware on the backend. Unauthenticated users are redirected to `/auth`. No passwords are stored in plaintext.

## What I Learned

The hardest full-stack challenge was completely transitioning the authentication flow from a third-party managed OTP system to an internally managed secure session cookie system. Ensuring that cross-origin requests handled cookies correctly across the client (`credentials: 'include'`) and the Express backend (`cors` config) required deep understanding of how modern browsers treat `SameSite` policies in different environments (dev vs production).

Submitted to Journey to Mastery — Level 3: Samurai
