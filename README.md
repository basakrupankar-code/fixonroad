<div align="center">
  <h1>🛠️ FixOnRoad</h1>
  <p><strong>Two-Wheeler On-Demand Roadside Assistance</strong></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <br/>
    <img src="https://img.shields.io/badge/Status-Kenshi_Milestone-success" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" />
  </p>
</div>

---

## 🔗 Quick Links
- **🔴 Live Demo URL:** [https://fixonroad.vercel.app](https://fixonroad.vercel.app)
- **📄 Level 1 Ronin PRD:** [`./docs/01-PRD.md`](./docs/01-PRD.md)
- **🏛️ Architecture Spec:** [`./docs/02-ARCHITECTURE.md`](./docs/02-ARCHITECTURE.md)

---

## 📋 Core Functionality (Frontend Sprint)
The Kenshi milestone focuses exclusively on rendering a flawless, high-fidelity frontend experience representing our pilot area: Kalyani, West Bengal.

### 1. Interactive Service Catalog & Garage Locator
- **Description:** Users can utilize a location picker (mocking Kalyani coordinates) to discover nearby garages and mechanics.
- **Data Source:** Fed by local structured JSON mock databases representing real local inventory and service parameters.
- **Edge Cases:** Includes a dedicated empty state UI for "Zero Search Results" if the user drops a pin outside the defined service area.

### 2. Booking State Machine & Request Simulation
- **Description:** A robust multi-step interactive flow simulating the core business loop: `Request Help` ➔ `Searching for Mechanic` ➔ `Mechanic Accepted / Timeout` ➔ `Live Status Timeline`.
- **Data Source:** Orchestrated entirely via dynamic client-side React state, simulating asynchronous latency with custom React hooks.
- **Edge Cases:** Simulates network fallback UIs if the request times out or is rejected.

### 3. Dynamic Pricing & Checkout
- **Description:** A breakdown of labor, parts, and distance costs rendered dynamically based on cart selections. Features a payment mode selector.
- **Data Source:** Component state aggregating base mock prices.
- **Edge Cases:** Client-side form validation for card payments with a mock Razorpay integration. 

---

## 🎨 Design System & Polish

- **Dark Mode Architecture:** Full implementation utilizing Tailwind CSS's `dark:` class strategy. The design gracefully toggles across all components without flash or flicker.
- **Typography & Spacing Rhythm:** Strictly adheres to a standard 4px/8px modular scale. The baseline font size is fixed at `16px` (1rem) for maximum accessibility on mobile devices.
- **Loading States:** Implemented comprehensive skeleton loaders for the garage lists and interactive processing states (spinners/disabling) for all asynchronous button actions.

---

## 📱 Responsiveness & Previews

The application layout leverages CSS Grid and Flexbox to guarantee a flawless responsive experience across all viewports.
- **Breakpoint Guarantee:** Fully fluid from `375px` (mobile viewport) scaling up perfectly to `1280px+` (desktop monitors).

### Screenshot Gallery

![Desktop Dashboard (Dark Mode)](./docs/screenshots/desktop-dark.png)
<br/>
![Mobile View - 375px](./docs/screenshots/mobile-view.png)
<br/>
![Empty & Error States](./docs/screenshots/empty-state.png)
<br/>
![Screen Flow Diagram](./screen-flow.svg)

---

## 🧭 Scope Drift & Ronin Alignment

| Feature / Scope | Ronin PRD Plan | Kenshi Frontend Implementation | Drift Rationale |
| :--- | :--- | :--- | :--- |
| **Authentication** | Full OAuth (Google, OTP) & JWT Backend | Client-side Session Mocking (React Context) | Deferred backend setup to prioritize high-fidelity UI layout and sprint timelines. |
| **Map Integration** | Live Google Maps SDK integration for tracking | Static localized distance/ETA approximations | Avoided 3rd-party API overhead & billing setup during the frontend evaluation phase. |
| **Database** | MongoDB/PostgreSQL clusters | Local JSON structures & state machines | Ensuring 100% reliable evaluation uptime and focusing purely on React component architecture. |
| **Real-time Chat** | WebSockets/Socket.io messaging | Pre-defined "Status Updates" timeline UI | Advanced real-time networking scoped for the backend milestone. |

---

## 🧠 Post-Mortem & Technical Insights

- **Component Architecture:** We isolated UI components (Buttons, Modals, Inputs) from Business Logic containers early on. This made implementing Dark Mode and Skeleton Loaders significantly easier and prevented prop drilling.
- **State Management:** Decided to rely on standard React Context + custom hooks for the state machine rather than bringing in Redux. This kept the bundle size small and perfectly handled our simulated checkout flow without massive boilerplate.
- **CSS Optimization:** Leaning heavily into Tailwind CSS utility classes allowed us to strip out custom CSS files entirely. Leveraging Tailwind's JIT compiler resulted in an incredibly small final CSS payload, contributing to near-instant First Contentful Paint (FCP).

---

## 🚀 Local Development Setup

To review the project locally, please follow these 3 simple steps:

```bash
# 1. Clone the repository and navigate to the client folder
git clone <your-repo-url>
cd client

# 2. Install all node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The application will be running locally at `http://localhost:5173`.
