# 04 · Requirements Specification: FixOnRoad

**Priority scale (MoSCoW):** **Must** = MVP fails without it · **Should** = expected, cut only under time pressure · **Could** = nice to have · **Won't** = explicitly not in MVP.
**Screens** refer to the [screen flow](../design/screen-flow.svg): `1–13` customer, `M1–M5` mechanic.
**Related:** [PRD](01-PRD.md) · [API](03-API-SPEC.md) · [Architecture](02-ARCHITECTURE.md) · [Roadmap](05-ROADMAP.md)

---

## 1. Functional requirements

### Authentication and profile
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-01 | User can log in with phone number + OTP | Must | R1 |
| FR-02 | User chooses the role (customer or mechanic) on first login | Must | R1, M1 |
| FR-03 | Session persists via JWT; user can log out | Must | R1 |
| FR-04 | User can view and edit name and email | Should | R1 |
| FR-05 | Customer can save and delete addresses | Could | R11 |

### Location and discovery
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-06 | App detects current location using browser geolocation | Must | R2 |
| FR-07 | User can search an address or drag a map pin; address is reverse-geocoded | Must | R2 |
| FR-08 | App lists bike services with fixed prices | Must | R3 |
| FR-09 | App lists online mechanics within 5 km, sorted by distance then rating, showing distance, ETA, rating and price | Must | R4 |

### Booking lifecycle
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-10 | Customer can send a request to one chosen mechanic | Must | R5 |
| FR-11 | Mechanic can accept or decline; unanswered requests expire after 60 s | Must | M2 |
| FR-12 | Customer can cancel until the mechanic has started the service | Must | R7 |
| FR-13 | A customer can have only one active booking at a time | Should | R5 |
| FR-26 | Mechanic can set Arrived → In progress → Completed; invalid jumps are rejected | Must | M4 |

### Tracking and communication
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-14 | Mechanic's location is sent at most every 5 s while a booking is `ACCEPTED` | Must | M3 |
| FR-15 | Customer sees the mechanic on a map with ETA and distance | Must | R6 |
| FR-16 | Customer sees a live status timeline | Must | R6 |
| FR-17 | Call buttons open the phone dialer (`tel:`) | Should | R6, M3 |
| FR-28 | Status changes and new requests appear in-app without refreshing | Must | R5, M2 |

### Payment
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-18 | Customer sees price + platform fee = total before paying | Must | R3, R8 |
| FR-19 | Mechanic can confirm cash received, which marks the booking `PAID` | Must | M5 |
| FR-20 | Customer can pay online (UPI/card via Razorpay test mode); server verifies the signature | Should (Must by Samurai) | R8 |

### Reviews and history
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-21 | Customer can rate 1–5 with optional comment and tags after `PAID` | Must | R9 |
| FR-22 | Mechanic's average rating and count update after each review | Must | R9 |
| FR-23 | Customer sees booking history with All / Upcoming / Completed filters | Should | R10 |

### Mechanic tools
| ID | Requirement | Priority | Story |
|---|---|---|---|
| FR-24 | Mechanic can toggle online/offline; only online mechanics appear in search | Must | M1 |
| FR-27 | Mechanic sees a list of past jobs | Should | M6 |

### Explicitly out of MVP (Won't)
Car service · towing · wallet · in-app chat · push notifications · dynamic pricing · admin panel · mechanic payouts.

---

## 2. Non-functional requirements

| ID | Category | Requirement | How it is checked |
|---|---|---|---|
| NFR-01 | Performance | Nearby search responds in under 300 ms (p95) with 1,000 seeded mechanics | Load test on seeded DB |
| NFR-02 | Realtime | Location update reaches the customer within 5 s | Manual test on two devices |
| NFR-03 | Usability | Works at 360 px width; primary tap targets ≥ 44 px; core flow ≤ 6 taps from Home to request sent | Device/emulator walkthrough |
| NFR-04 | Compatibility | Latest Chrome (Android/desktop) and Safari (iOS) | Manual smoke test |
| NFR-05 | Security | OTP rate-limited; all inputs validated; payment signature verified server-side; no secrets in the repo | Code review + test cases |
| NFR-06 | Reliability | Invalid state transitions return 409 and change nothing; `/health` endpoint exists | Automated tests |
| NFR-07 | Privacy | Locations are shared only within an active booking (see Architecture §8) | Authorization tests |
| NFR-08 | Maintainability | Lint + formatting configured; `.env.example`; README explains run and seed steps | Repo review |
| NFR-09 | Accessibility | Text contrast ≥ 4.5:1; form fields have labels | Lighthouse check |
| NFR-10 | Observability | Structured server logs for auth, booking and payment events | Log review |

---

## 3. Acceptance criteria (Must-have flows)

**AC-1 · Request a mechanic** (FR-08, FR-09, FR-10)
- *Given* a logged-in customer with a confirmed location and a chosen service,
- *When* they tap **Request** on an online mechanic within 5 km,
- *Then* a `REQUESTED` booking is created with the catalog price and a 60 s expiry, the mechanic receives it in real time, and the customer sees the *Waiting* screen.

**AC-2 · Accept / expire** (FR-11)
- *Given* a `REQUESTED` booking,
- *When* the mechanic accepts within 60 s, *Then* status becomes `ACCEPTED` and the customer moves to live tracking.
- *When* 60 s pass with no response, *Then* status becomes `EXPIRED` and the customer returns to the mechanic list with a message.

**AC-3 · One active booking** (FR-13)
- *Given* a customer with an active booking, *When* they try to create another, *Then* the API returns 409.

**AC-4 · Live tracking** (FR-14, FR-15)
- *Given* an `ACCEPTED` booking, *When* the mechanic's device reports a new position, *Then* the customer's map marker moves within 5 s and the ETA text updates.

**AC-5 · Status integrity** (FR-26)
- *Given* a booking in `ACCEPTED`, *When* the mechanic sends `COMPLETED`, *Then* the API returns 409 and the status is unchanged.

**AC-6 · Cancellation** (FR-12)
- *Given* a booking in `REQUESTED`, `ACCEPTED` or `ARRIVED`, *When* the customer cancels, *Then* it becomes `CANCELLED` and the mechanic is notified.
- *Given* `IN_PROGRESS`, *Then* the cancel action is not available.

**AC-7 · Online payment** (FR-20)
- *Given* a `COMPLETED` booking, *When* Razorpay returns a valid signature, *Then* the payment is `paid` and the booking is `PAID`.
- *When* the signature is invalid, *Then* the API returns 400 and the booking stays `COMPLETED`.

**AC-8 · Cash payment** (FR-19)
- *Given* a `COMPLETED` booking with cash selected, *When* the assigned mechanic confirms cash, *Then* the booking becomes `PAID`.

**AC-9 · Review** (FR-21, FR-22)
- *Given* a `PAID` booking, *When* the customer submits 4 stars, *Then* the review is saved once and the mechanic's average rating is recalculated. A second review returns 409.

---

## 4. Traceability: requirement → screen → API

| Req. | Screen | API / event |
|---|---|---|
| FR-01, FR-02 | 2 Login/OTP | `POST /auth/otp/request`, `POST /auth/otp/verify` |
| FR-03 | 13 Profile | JWT; client-side logout |
| FR-04 | 13 Profile | `GET/PATCH /me` |
| FR-05 | 4, 13 | `/me/addresses` |
| FR-06, FR-07 | 4 Location | Browser Geolocation, Nominatim (client-side) |
| FR-08 | 5 Service | `GET /services` |
| FR-09 | 6 Nearby mechanics | `GET /mechanics/nearby` |
| FR-10 | 6 → 7 Waiting | `POST /bookings` |
| FR-11 | M2 New request | `PATCH /bookings/:id/status`, event `booking:new` |
| FR-12 | 7, 8 | `PATCH /bookings/:id/status` (CANCELLED) |
| FR-13 | 3 Home | `POST /bookings` (409), `GET /bookings?active=true` |
| FR-14 | M3 Navigate | event `mechanic:location`, `PUT /mechanic/me/location` |
| FR-15 | 8 Live tracking | `GET /bookings/:id`, event `mechanic:location` |
| FR-16 | 9 Job status | event `booking:status` |
| FR-17 | 6, 8, M3 | `tel:` link |
| FR-18 | 10 Payment | `GET /bookings/:id` |
| FR-19 | M5 | `POST /payments/cash-confirm` |
| FR-20 | 10 Payment | `POST /payments/create-order`, `POST /payments/verify` |
| FR-21, FR-22 | 11 Review | `POST /reviews`, `GET /mechanics/:id/reviews` |
| FR-23 | 12 My Bookings | `GET /bookings` |
| FR-24 | M1 Go online | `PATCH /mechanic/me/status` |
| FR-26 | M3, M4 | `PATCH /bookings/:id/status` |
| FR-27 | M1 | `GET /bookings` (mechanic role) |
| FR-28 | 7, 8, 9, M2 | Socket.IO events |
