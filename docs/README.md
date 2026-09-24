# FixOnRoad

> On-demand roadside help for two-wheeler breakdowns: find a nearby mechanic, see a fixed price, track them live, and pay in the app.

**Journey to Mastery · Level 1: Ronin (planning only, no application code)**
**Author:** _your name_ · **Pilot area:** Kalyani, West Bengal

![FixOnRoad screen flow](design/screen-flow.svg)

---

## The problem

When a bike breaks down on the road, the rider has no reliable way to find a mechanic who is available now, no idea how long they will take, and no idea what it will cost until the bargaining starts. Independent mechanics have idle time but no way to be found for on-the-spot jobs. FixOnRoad matches the two: the rider picks the problem, sees a **fixed price** and **ETA**, requests a mechanic, **tracks them live**, pays, and rates the job.

## Documents

Read in this order:

| # | Document | What it answers |
|---|---|---|
| 1 | [PRD](docs/01-PRD.md) | Who has the problem, why it matters, what the MVP includes **and deliberately excludes** |
| 2 | [Architecture](docs/02-ARCHITECTURE.md) | System diagram, tech stack and reasons, data model, booking state machine, realtime design, security |
| 3 | [API Spec](docs/03-API-SPEC.md) | Every REST endpoint and Socket.IO event, with auth, examples and errors |
| 4 | [Requirements](docs/04-REQUIREMENTS.md) | Prioritised functional and non-functional requirements, acceptance criteria, requirement → screen → API traceability |
| 5 | [Roadmap](docs/05-ROADMAP.md) | Ronin plan, milestones for Kenshi / Samurai / Shogun, cut lines, submission checklist |
| ✏️ | [Screen flow (SVG)](design/screen-flow.svg) · [Editable Excalidraw](design/screen-flow.excalidraw) | 13 customer screens + 5 mechanic screens, with changes from the original UI marked |

To edit the sketch, open [excalidraw.com](https://excalidraw.com) and drag in `design/screen-flow.excalidraw`.

## MVP at a glance

**Building:** phone-OTP login · location picker · bike service catalog with fixed prices · nearby mechanics · request → accept/decline (60 s timeout) · live tracking · job status timeline · cash and Razorpay (test mode) payment · ratings · booking history · a minimal mechanic view.

**Not building (yet):** car service · towing · wallet · chat · push notifications · dynamic pricing · admin panel. Reasons are listed in [PRD §5](docs/01-PRD.md#5-mvp-scope-what-i-will-and-wont-build).

## Planned tech stack

React + Vite (PWA) · Tailwind · Leaflet/OpenStreetMap · Node.js + Express · Socket.IO · PostgreSQL + PostGIS · Razorpay · Vercel + Render + Neon.
Justification for each choice: [Architecture §2](docs/02-ARCHITECTURE.md#2-tech-stack-and-why).

## Roadmap

| Level | Focus |
|---|---|
| **Ronin** (this repo) | Product definition, architecture, roadmap |
| Kenshi | Working core loop: login → service → nearby mechanics → booking accepted |
| Samurai | Live tracking, mechanic job flow, payments, reviews |
| Shogun | Tests, security pass, deployment, polish |

Full milestone tables: [docs/05-ROADMAP.md](docs/05-ROADMAP.md).

## How the documents stay consistent

- Requirements use IDs (`FR-01` … `FR-28`, `NFR-01` … `NFR-10`) that appear in the API spec and roadmap.
- Screens are numbered `1–13` (customer) and `M1–M5` (mechanic) in the sketch and used in the requirement traceability table.
- Booking states (`REQUESTED → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED → PAID`, plus `DECLINED`, `EXPIRED`, `CANCELLED`) are identical in the architecture, API and acceptance criteria.

## Planned repository structure (from Kenshi)

```
fixonroad/
├── client/    # React + Vite PWA
├── server/    # Express + Socket.IO
├── db/        # migrations + seed data
├── docs/      # these planning documents
└── design/    # Excalidraw sketch
```
