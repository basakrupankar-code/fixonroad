# FixOnRoad - Kenshi Level 2 Submission

## Overview
FixOnRoad is a roadside assistance platform connecting stranded riders with local mechanics. This is the **Level 2 (Kenshi)** submission, focusing entirely on Frontend Craft (Visual Design, UI Polish, Animations, and Responsiveness).

## Features & Data Connection (Level 2 Rubric)
1. **Dynamic Services Search (JSON Data):** The Services page (`ServicesPage.tsx`) maps over structured JSON data, rendering services dynamically with search filtering.
2. **Mechanic Dashboard Mockup:** The Mechanic Landing page features dynamic counter hooks and auto-cycling testimonials using Framer Motion.
3. **Interactive Payment Flow:** The Payment page uses form inputs and local state to simulate processing, with graceful error states (e.g., card validation).

## Visual Design & Animations
- **Dark Mode Aesthetic:** Built with a consistent color palette (Emerald/Teal for Mechanics, Blue/Purple for Riders).
- **Responsive Layout:** fully responsive from 375px (mobile) to 1280px (desktop) using Tailwind CSS grids/flexbox.
- **Framer Motion Micro-interactions:** Includes 60fps staggered fade-ups, scroll-driven hero scaling, continuous ambient glows, and hover micro-interactions.

## Setup Instructions
1. Run `npm install`
2. Run `npm run dev`
3. Open `http://localhost:5173`

## Learnings
Building this frontend taught me how to strictly type `framer-motion` variants (fixing specific Easing TypeScript errors) and how to manage complex CSS grid layouts combined with fixed floating elements (like the payment CTA).
