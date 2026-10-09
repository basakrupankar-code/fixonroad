# FixOnRoad 🚀

FixOnRoad is a full-stack on-demand roadside assistance platform. It connects stranded drivers with nearby mechanics in real-time, providing services like flat tire repair, battery jump-starts, towing, and more.

## Level 3 Samurai Refactor 🥷

This project has been completely refactored to meet the Level 3 Samurai Evaluation Rubric criteria, transitioning from client-side mocks to a hardened production-ready full-stack system.

### Key Features & Architectural Highlights
1. **Full-Stack Data Persistence:** MongoDB used for `Users`, `Mechanics`, and `Orders`.
2. **Robust Authentication:** JWT-based secure session management, with server-side HTTP-only cookies and protected routes for both customers and mechanics.
3. **State Machine & Payment Lifecycles:** Orders expire precisely after 5 minutes if unpaid. Payment calculations (GST + Platform fees) are strictly validated server-side.
4. **Zomato-Style Floating Cart:** Dynamic UI bottom tray pops up for seamless checkout.
5. **Live Telemetry Radar:** A dark-mode "Live Dispatch Radar" visualizes live mechanic availability and tracking.
6. **Trilingual AI Assistant:** Built-in AI chat widget to help users navigate emergencies in multiple languages.
7. **Automated Testing:** Vitest and Supertest ensure pricing math and auth routes remain rock-solid. Playwright covers the critical user path end-to-end.

## Tech Stack
- **Frontend:** React + Vite, Tailwind CSS, Framer Motion, Playwright.
- **Backend:** Node.js, Express, Mongoose (MongoDB), Zod (Validation), Vitest.
- **Theme:** Dark Highway (Deep backgrounds, glassmorphic panels, amber accents).

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MONGO_URI
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Running Tests
- **Backend Unit/Integration (Vitest):** `cd server && npm run test`
- **Frontend E2E (Playwright):** `cd client && npx playwright test`

## Environment Variables
**Server (`server/.env`)**
- `NODE_ENV`: development | production
- `PORT`: 5000
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret for signing tokens
- `CLIENT_ORIGIN`: Allowed origin for CORS (e.g., http://localhost:5173)

**Client (`client/.env`)**
- `VITE_API_URL`: Backend URL (e.g., http://localhost:5000/api/v1)

## Deployment
The project is configured for Render using `render.yaml`.
- API deploys as a Node Web Service.
- Client deploys as a Static Site.
Make sure to set the environment variables in the Render dashboard.
