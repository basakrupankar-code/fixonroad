# 01 · Product Requirements Document (PRD): FixOnRoad

**Version:** 1.0 · **Level:** Ronin · **Pilot area:** Kalyani, West Bengal
**Related:** [Requirements](04-REQUIREMENTS.md) · [Architecture](02-ARCHITECTURE.md) · [API](03-API-SPEC.md) · [Roadmap](05-ROADMAP.md) · [Screen flow](../design/screen-flow.svg)

---

## 1. Summary

FixOnRoad connects a stranded two-wheeler rider with a nearby mechanic who comes to them. The rider picks the problem, sees a **fixed price** and the mechanic's **ETA**, sends a request, **tracks the mechanic live**, pays in the app, and rates the job.

One line: *"Ola/Uber for bike breakdowns."*

---

## 2. The problem

### 2.1 What is broken today

When a bike stops on the road (puncture, dead battery, won't start, snapped chain), the rider has no reliable way to get help:

| Pain point (rider) | Today's workaround |
|---|---|
| Doesn't know who is available *right now* or how long they will take | Calls acquaintances, asks passers-by |
| Price is unknown until the work is done, so there is haggling | Negotiates on the roadside, often with no leverage |
| No accountability: no record, rating or recourse | Word of mouth only |
| Stressful and unsafe, especially at night or on quiet roads | Pushes the bike to the nearest shop |

| Pain point (mechanic) | Today's workaround |
|---|---|
| Income depends on walk-ins and word of mouth | Waits at the shop, with idle time between jobs |
| Cannot be discovered for on-the-spot jobs | Relies on regular customers' phone calls |
| No job history or digital payment trail | Cash and memory |

> These are **hypotheses** until validated. See §2.3.

### 2.2 Why it is worth solving now
- Smartphones with GPS are standard, and UPI makes small digital payments realistic even for local garages.
- The job is **urgent and location-bound**, which suits an app that matches by distance and time.
- The service list is small and well understood (puncture, battery, chain, and so on), so **fixed pricing is feasible**.

### 2.3 Problem validation (complete this in Week 1)

| Hypothesis | Method | Evidence |
|---|---|---|
| Riders struggle to find help quickly during a breakdown | Interview 5 riders (students, daily commuters) | `TODO: paste findings` |
| Price uncertainty is a major frustration | Same interviews, ask about the last breakdown | `TODO` |
| Mechanics have idle time and would accept app-based jobs | Interview 3 local mechanics | `TODO` |
| Riders would pay a small platform fee for a confirmed ETA and price | Ask directly, and note hesitation | `TODO` |

**Interview questions:**
1. Tell me about the last time your bike broke down. Where were you, and what did you do?
2. How long did it take to get help? What did it cost? Was the price a surprise?
3. What would have made that situation less stressful?
4. (Mechanics) How do you get roadside jobs today? How much of your day is idle?
5. (Mechanics) Would you accept a job through an app if payment was guaranteed? What worries you?

### 2.4 Existing alternatives (verify and expand during research)
- **Local directories and maps** (Google Maps, Justdial): list garages but show no live availability, ETA or fixed price.
- **Insurance or brand roadside-assistance programs:** mostly tied to a paid plan and focused on cars.
- **Calling a known mechanic:** works only if you already have one and he is free.

**Gap:** no simple, on-demand, **two-wheeler-first** service with upfront price and live tracking.

---

## 3. Target users

### Primary: the Rider (customer)
**"Ravi", 24.** College student and daily commuter on a 125cc bike. A puncture 3 km from home at 8 pm. Has UPI, low tolerance for haggling.
*Needs:* fast help, a known price, confidence that someone is really coming.

### Primary: the Mechanic (provider)
**"Sanjay", 35.** Runs a small two-wheeler garage with one helper. Has idle hours between walk-ins, owns a scooter to reach customers.
*Needs:* more jobs, clear job details, reliable payment.

### Out of scope for MVP: Admin
Mechanics are **seeded directly into the database**. An admin panel comes later (see the roadmap).

---

## 4. Goals and non-goals

### Goals
| # | Goal | Measurable target (for the demo build) |
|---|---|---|
| G1 | Get a rider from app-open to request-sent quickly | ≤ 6 taps and under 60 s (logged-in user) |
| G2 | Remove price surprises | Price shown before the request and never changed by the mechanic in the app |
| G3 | Give live visibility | Mechanic location updates on the rider's map within 5 s |
| G4 | Give mechanics a usable job loop | Go online → accept → update status → get paid, with no manual admin step |

### Non-goals (MVP)
- Not a marketplace for parts or spare-part delivery
- Not a garage booking or appointment system
- Not car or four-wheeler service (deferred)
- Not a towing or heavy recovery service (deferred)
- Not a dispatch or fleet-management tool

---

## 5. MVP scope: what I will and won't build

### In scope
1. Phone-number OTP login (rider and mechanic roles)
2. Location: current location or pick on a map
3. **Bike-only** service catalog with **fixed prices** (6 services)
4. Nearby online mechanics: distance, ETA, rating, price
5. **Request → Accept/Decline** flow with a 60 s timeout
6. Live tracking and a job status timeline
7. Payment: **cash** and **online (UPI/card via Razorpay test mode)**
8. Rating and review; booking history
9. A minimal **mechanic view** (same web app, mechanic role)

### Out of scope (and why)

| Cut | Why | Earliest return |
|---|---|---|
| Car service and vehicle picker (screen 4 in the original UI) | Doubles the catalog and pricing work; bike is enough to prove the loop | Post-Shogun |
| Towing | Needs different vehicles, pricing and dispatch | Post-Shogun |
| Wallet tab | Adds ledger and refund complexity; cash and UPI cover payment | Post-Shogun |
| In-app chat | `tel:` call links cover the need | Stretch |
| Push notifications | In-app realtime updates are enough for the demo | Stretch |
| Surge or dynamic pricing | Undermines the "fixed price" promise | Not planned |
| Admin panel and mechanic KYC automation | Seed data for the demo | Shogun |
| Multi-city support | One pilot area is enough | Not planned |

### Deliberate changes from the original 12-screen UI

| Original design | Problem | MVP decision |
|---|---|---|
| Screen 6: rider taps **Accept** on a mechanic | The rider does not accept; the mechanic does | Rider taps **Request**, mechanic **Accepts/Declines**, with a new *Waiting* screen |
| No login screen | Splash has "Login" but leads nowhere | Add **Login/OTP** screen |
| Price shown only at payment | Price surprise, and higher dispute risk | Show price on the service list and mechanic list |
| Wallet tab with no screen | Dead end | Removed; nav is Home / Bookings / Profile |
| Timeline has "Started" and "In Progress" | Same state twice | Merged into one `IN_PROGRESS` state |

---

## 6. User stories

### Rider
| ID | Story | Priority |
|---|---|---|
| R1 | As a rider, I log in with my phone number so my bookings are saved | Must |
| R2 | As a rider, I set my breakdown location so a mechanic can find me | Must |
| R3 | As a rider, I pick my problem and see a fixed price so there are no surprises | Must |
| R4 | As a rider, I see nearby mechanics with distance, ETA and rating so I can choose | Must |
| R5 | As a rider, I request a mechanic and see whether they accept so I know help is coming | Must |
| R6 | As a rider, I track the mechanic live so I know when he arrives | Must |
| R7 | As a rider, I cancel before the mechanic arrives if my situation changes | Must |
| R8 | As a rider, I pay by UPI/card or cash so I can use what I have | Must |
| R9 | As a rider, I rate the mechanic so others can trust good ones | Must |
| R10 | As a rider, I see my past bookings | Should |
| R11 | As a rider, I save addresses | Could |

### Mechanic
| ID | Story | Priority |
|---|---|---|
| M1 | As a mechanic, I go online/offline so I only get jobs when I am available | Must |
| M2 | As a mechanic, I see an incoming request with service, distance and price, and accept or decline | Must |
| M3 | As a mechanic, I share my live location and navigate to the rider | Must |
| M4 | As a mechanic, I update status (arrived, in progress, completed) | Must |
| M5 | As a mechanic, I confirm cash received, or see online payment confirmed | Must |
| M6 | As a mechanic, I see my job history | Should |

---

## 7. Core journey (happy path)

1. Rider opens app → logs in with OTP.
2. Confirms location (current or map pin).
3. Picks the problem (e.g. *Puncture Repair, ₹250*).
4. Sees nearby online mechanics; taps **Request** on one.
5. Mechanic gets the request → **Accepts** (within 60 s).
6. Rider watches the mechanic approach on the map (ETA, call button).
7. Mechanic marks **Arrived** → **Start service** → **Completed**.
8. Rider pays (UPI/card) or mechanic confirms cash.
9. Rider rates the mechanic; the job appears in booking history.

**Failure paths that must be handled:** mechanic declines or times out (→ back to the list), rider cancels, payment fails (retry or switch to cash), no mechanics nearby (empty state with a wider radius option).

---

## 8. Success metrics

**Product (if launched):** request acceptance rate · completed-job rate · median ETA vs actual arrival · repeat riders · average rating.

**Build/demo (used to judge this project):**
- The full happy path works end to end with no manual DB edits.
- Location updates reach the rider within 5 s.
- Invalid status changes are rejected (e.g. `COMPLETED` before `ARRIVED`).
- Razorpay payments are verified server-side.

---

## 9. Assumptions and risks

| Risk / assumption | Impact | Mitigation |
|---|---|---|
| Not enough mechanics in an area | Riders see an empty list | Seed a realistic demo set; show "expand radius" |
| Mechanic ignores or times out on requests | Bad rider experience | 60 s expiry, automatic return to the list |
| GPS is inaccurate or blocked | Wrong ETA/route | Let the rider drag the pin; show address text |
| Payment disputes | Trust loss | Fixed prices, status timeline as a record |
| Free-tier hosting sleeps | Slow demo | Warm-up ping; noted in the deployment plan |
| Rider safety and mechanic trust | Real-world risk | Show name/rating/photo; call button; KYC listed as a later feature |

**Assumption:** the browser Geolocation API is accurate enough on mobile for the demo.

---

## 10. Open questions
- Should the platform fee (₹50 in the design) be flat or percentage-based? *(Flat for MVP.)*
- Is there a cancellation fee after the mechanic has started travelling? *(No fee in MVP; recorded for later.)*
- How are mechanics paid out when the rider pays online? *(Out of MVP; the demo records the payment only.)*
