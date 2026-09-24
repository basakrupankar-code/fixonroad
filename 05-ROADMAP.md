# 05 · Roadmap: FixOnRoad

**Related:** [PRD](01-PRD.md) · [Requirements](04-REQUIREMENTS.md) · [Architecture](02-ARCHITECTURE.md)

> **Note on levels:** Ronin is planning only. The Kenshi, Samurai and Shogun milestones below are **my plan for the same project**, organised by capability. Adjust the exact grouping to each level's official brief when it is released. The scope itself (Must-haves in the Requirements doc) does not change.

---

## 1. Program overview

| Level | Theme | Outcome | Code |
|---|---|---|---|
| **Ronin** (now) | Product thinking | PRD, architecture, API, requirements, roadmap, screen flow | ❌ |
| **Kenshi** | Working core loop | A rider can log in, pick a service and create a booking that a mechanic can act on | ✔ |
| **Samurai** | Real-time and money | Live tracking, mechanic-side flow, payments, reviews | ✔ |
| **Shogun** | Production quality | Hardening, tests, deployment, docs, polish | ✔ |

---

## 2. Ronin: 2-week plan

| When | Task | Output |
|---|---|---|
| Week 1, days 1–2 | Interview 5 riders + 3 mechanics; write findings | PRD §2.3 filled with real evidence |
| Week 1, days 3–4 | Write the PRD; lock MVP scope and cut list | [01-PRD.md](01-PRD.md) |
| Week 1, day 5 | Write requirements and acceptance criteria | [04-REQUIREMENTS.md](04-REQUIREMENTS.md) |
| Week 2, days 1–2 | Architecture, data model, state machine | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) |
| Week 2, day 3 | API endpoints and events | [03-API-SPEC.md](03-API-SPEC.md) |
| Week 2, day 4 | Screen-flow sketch in Excalidraw | [design/](../design/) |
| Week 2, day 5 | README, consistency pass, push to public GitHub, submit | Submission |

---

## 3. Milestones by level

### Kenshi: working core loop
| # | Milestone | Requirements | Done when |
|---|---|---|---|
| K1 | Project scaffold: client, server, DB, migrations, seed | NFR-08 | `npm run dev` starts everything; seed loads services + demo mechanics |
| K2 | Phone OTP login, roles, profile | FR-01–FR-04 | Can sign up as customer and as mechanic |
| K3 | Location picker and service catalog | FR-06–FR-08 | Location and service are chosen in the UI |
| K4 | Nearby mechanics | FR-09, FR-24 | Search returns seeded online mechanics with distance and price |
| K5 | Create booking and mechanic accept/decline | FR-10, FR-11, FR-13 | AC-1, AC-2, AC-3 pass |

### Samurai: real-time and money
| # | Milestone | Requirements | Done when |
|---|---|---|---|
| S1 | Socket.IO rooms + status broadcast | FR-16, FR-28 | Status changes appear without refresh |
| S2 | Live tracking | FR-14, FR-15, FR-17 | AC-4 passes on two devices |
| S3 | Mechanic job flow (arrived → completed) and cancellation | FR-12, FR-26 | AC-5, AC-6 pass |
| S4 | Payments: cash and Razorpay test mode | FR-18–FR-20 | AC-7, AC-8 pass |
| S5 | Reviews and booking history | FR-21–FR-23, FR-27 | AC-9 passes; history lists all states |

### Shogun: production quality
| # | Milestone | Requirements | Done when |
|---|---|---|---|
| G1 | Automated tests for the state machine, auth and payment verification | NFR-05, NFR-06 | Tests run in CI and pass |
| G2 | Security and privacy pass | NFR-05, NFR-07 | Authorization matrix verified |
| G3 | Deploy: Vercel + Render + Neon | Architecture §9 | Public URL runs the full happy path |
| G4 | Performance, accessibility, error and empty states | NFR-01, NFR-03, NFR-09 | Lighthouse and load-test targets met |
| G5 | Final docs, demo script and screen recording | NFR-08 | README lets a stranger run the project |

### Stretch (only after Shogun is done)
Saved addresses (FR-05) · push notifications · broadcast matching · admin panel · car service · wallet.

---

## 4. Cut lines (if time runs short)

1. Cut **first:** saved addresses, booking filters, mechanic job history.
2. Then: Razorpay online payment → keep **cash only**.
3. Then: dynamic ETA → show a fixed estimate from distance.
4. **Never cut:** OTP login, request/accept flow, status state machine, live location, reviews. These are the product.

---

## 5. Risks to the schedule

| Risk | Signal | Response |
|---|---|---|
| Realtime is harder than expected | Socket bugs eat more than 3 days | Use the 5 s polling fallback and revisit sockets later |
| Two roles double the UI work | Mechanic screens lag behind | Build the mechanic view as five plain pages with no extra polish |
| Free-tier hosting limits | Slow or sleeping API | Warm-up ping; note in the demo script |
| Scope creep | New features appear mid-level | Check the Won't list in [Requirements](04-REQUIREMENTS.md) first |

---

## 6. Ronin submission checklist (self-review against the rubric)

| Rubric area | Where to look | Check |
|---|---|---|
| **PRD and problem (25)** | [01-PRD.md](01-PRD.md) | ☐ Real interview findings added to §2.3 · ☐ MVP in/out list with reasons · ☐ Personas and measurable goals |
| **Architecture and API (25)** | [02](02-ARCHITECTURE.md) · [03](03-API-SPEC.md) | ☐ System diagram · ☐ Stack justified · ☐ Data model + state machine · ☐ Every endpoint has purpose, auth, examples |
| **UI sketch (20)** | [design/](../design/) | ☐ All screens and both roles shown · ☐ Flow arrows · ☐ Changes from original design marked |
| **Roadmap and spec (15)** | [04](04-REQUIREMENTS.md) · this file | ☐ Prioritised requirements + acceptance criteria · ☐ Milestones per level |
| **Docs and README (15)** | [README](../README.md) | ☐ README links every doc · ☐ IDs consistent across docs · ☐ Repo is public |
