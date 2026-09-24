# 03 · API Specification: FixOnRoad

**Base URL:** `/api/v1` · **Format:** JSON · **Auth:** `Authorization: Bearer <JWT>` (except where marked *Public*)
**Money:** integer rupees (`priceInr`); the server converts to paise for Razorpay. **Time:** ISO 8601 UTC.
**Related:** [Architecture](02-ARCHITECTURE.md) · [Requirements](04-REQUIREMENTS.md)

---

## 1. Endpoint summary

### Auth
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| POST | `/auth/otp/request` | Public | Send a 6-digit OTP to a phone number | FR-01 |
| POST | `/auth/otp/verify` | Public | Verify OTP, return JWT (creates user on first login) | FR-01, FR-02 |

### Profile
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| GET | `/me` | Any | Current user | FR-04 |
| PATCH | `/me` | Any | Update name / email | FR-04 |
| GET | `/me/addresses` | Customer | List saved addresses | FR-05 |
| POST | `/me/addresses` | Customer | Save an address | FR-05 |
| DELETE | `/me/addresses/:id` | Customer | Remove an address | FR-05 |

### Catalog and discovery
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| GET | `/services?vehicle=bike` | Public | Services with fixed prices | FR-08 |
| GET | `/mechanics/nearby?lat&lng&serviceId&radiusKm=5` | Customer | Online mechanics near a point | FR-09 |
| GET | `/mechanics/:id/reviews` | Customer | Reviews for a mechanic | FR-22 |

### Mechanic
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| PATCH | `/mechanic/me/status` | Mechanic | Go online / offline | FR-24 |
| PUT | `/mechanic/me/location` | Mechanic | Update location (REST fallback for the socket) | FR-14 |

### Bookings
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| POST | `/bookings` | Customer | Request a specific mechanic | FR-10, FR-13 |
| GET | `/bookings?status=&active=` | Any | Own bookings (customer or mechanic) | FR-23, FR-27 |
| GET | `/bookings/:id` | Owner | Booking detail (also used for polling fallback) | FR-15, FR-18 |
| PATCH | `/bookings/:id/status` | Owner | Change status per the state machine | FR-11, FR-12, FR-26 |

### Payments
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| POST | `/payments/create-order` | Customer | Create a Razorpay order for a `COMPLETED` booking | FR-20 |
| POST | `/payments/verify` | Customer | Verify signature, mark `PAID` | FR-20 |
| POST | `/payments/cash-confirm` | Mechanic | Confirm cash received, mark `PAID` | FR-19 |

### Reviews and health
| Method | Path | Auth | Purpose | Req. |
|---|---|---|---|---|
| POST | `/reviews` | Customer | Rate a `PAID` booking | FR-21, FR-22 |
| GET | `/health` | Public | Liveness check (used for warm-up) | NFR-06 |

---

## 2. Request and response examples

### `POST /auth/otp/request`
```json
// request
{ "phone": "+919876543210" }
// 200
{ "message": "OTP sent", "expiresInSeconds": 300 }
```

### `POST /auth/otp/verify`
```json
// request
{ "phone": "+919876543210", "otp": "123456", "role": "customer" }
// 200
{
  "token": "<jwt>",
  "user": { "id": "u_1", "phone": "+919876543210", "name": null, "role": "customer" },
  "isNewUser": true
}
```

### `GET /services?vehicle=bike`
```json
{
  "services": [
    { "id": 1, "name": "Puncture Repair", "description": "Get help for tyre puncture", "basePriceInr": 250 },
    { "id": 2, "name": "Battery Problem", "description": "Jump start / battery change", "basePriceInr": 800 },
    { "id": 5, "name": "General Service", "description": "Oil change, basic service", "basePriceInr": 500 }
  ]
}
```

### `GET /mechanics/nearby?lat=22.9751&lng=88.4345&serviceId=1&radiusKm=5`
```json
{
  "mechanics": [
    {
      "id": "m_1",
      "name": "Rohit Kumar",
      "garageName": "RiderFix Garage",
      "distanceKm": 1.2,
      "etaMinutes": 10,
      "ratingAvg": 4.8,
      "ratingCount": 254,
      "priceInr": 250,
      "feeInr": 50
    }
  ]
}
```
Sorted by distance, then rating. Returns `[]` if none, with the UI offering a wider radius. `etaMinutes` is a rough estimate (distance ÷ assumed average speed).

### `POST /bookings`
```json
// request
{
  "mechanicId": "m_1",
  "serviceId": 1,
  "pickup": { "lat": 22.9751, "lng": 88.4345, "address": "Kalyani, West Bengal" },
  "notes": "Rear tyre flat"
}
// 201
{
  "id": "b_1",
  "status": "REQUESTED",
  "priceInr": 250,
  "feeInr": 50,
  "totalInr": 300,
  "expiresAt": "2026-01-01T10:01:00Z"
}
```
Errors: `409` customer already has an active booking · `409` mechanic offline · `404` mechanic/service not found.

### `PATCH /bookings/:id/status`
```json
// request (mechanic)
{ "status": "ACCEPTED" }
// 200
{ "id": "b_1", "status": "ACCEPTED", "acceptedAt": "2026-01-01T10:00:20Z" }
```
Errors: `403` not your booking · `409` invalid transition (e.g. `REQUESTED → COMPLETED`) · `409` booking expired.

### `POST /payments/create-order`
```json
// request
{ "bookingId": "b_1" }
// 200
{ "orderId": "order_xxx", "amountPaise": 30000, "currency": "INR", "keyId": "rzp_test_xxx" }
```

### `POST /payments/verify`
```json
// request
{
  "bookingId": "b_1",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "<hmac>"
}
// 200
{ "status": "PAID" }
// 400 if the signature does not match
```

### `POST /reviews`
```json
// request
{ "bookingId": "b_1", "rating": 5, "comment": "Quick and polite", "tags": ["On Time", "Professional"] }
// 201
{ "id": "r_1" }
```
Errors: `409` already reviewed · `409` booking not `PAID`.

---

## 3. Error format

All errors use one shape:
```json
{ "error": { "code": "INVALID_TRANSITION", "message": "Cannot move from REQUESTED to COMPLETED" } }
```

| HTTP | Meaning |
|---|---|
| 400 | Validation failed / bad signature |
| 401 | Missing or invalid token |
| 403 | Authenticated but not allowed (wrong role or not the owner) |
| 404 | Resource not found |
| 409 | State conflict (invalid transition, active booking exists, already reviewed) |
| 429 | Rate limit (OTP requests) |
| 500 | Unexpected server error |

---

## 4. Realtime events (Socket.IO)

Connect with `auth: { token: <jwt> }`. Rooms: `mechanic:{id}` and `booking:{id}`.

| Event | Direction | Room | Payload | Used by |
|---|---|---|---|---|
| `booking:new` | Server → Mechanic | `mechanic:{id}` | `{ bookingId, service, priceInr, distanceKm, pickup, expiresAt }` | Screen M2 |
| `booking:status` | Server → Both | `booking:{id}` | `{ bookingId, status, at }` | Screens 7, 8, 9, M4 |
| `mechanic:location` | Mechanic → Server → Customer | `booking:{id}` | `{ bookingId, lat, lng, at }` (≤ 1 per 5 s) | Screens 8, M3 |
| `booking:join` | Client → Server | n/a | `{ bookingId }` (server verifies ownership) | Screens 7, 8, M3 |

---

## 5. Authorization matrix

| Action | Customer | Mechanic |
|---|---|---|
| Create booking | ✔ (own) | ✘ |
| Accept / decline | ✘ | ✔ (assigned only) |
| Arrived / start / complete | ✘ | ✔ (assigned only) |
| Cancel | ✔ (own) | ✔ (assigned, `ACCEPTED` only) |
| Create payment order / verify | ✔ (own) | ✘ |
| Confirm cash | ✘ | ✔ (assigned only) |
| Post review | ✔ (own, `PAID`) | ✘ |
