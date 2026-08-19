# OSC SmartCheck AI — Development Guidelines

**Project:** OSC SmartCheck AI  
**Organization:** One Stop Centre (OSC), Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)

---

## 1. Code Standards & Architecture Conventions

### 1.1. TypeScript Conventions
- Strict mode is enforced (`"strict": true` in `tsconfig.json`).
- Avoid `any`. Use strict union types, interfaces, or generics.
- Define shared domain interfaces in `src/types/` (e.g. `src/types/common.ts`, `src/types/firebase.ts`).
- Server components and client components must be explicitly delineated with `'use client'` only where state or browser APIs are required.

### 1.2. Directory & Component Structure
- `src/app/`: Next.js App Router pages, layouts, loading boundaries, and error handlers.
- `src/components/layout/`: Global layout components (Header, Sidebar, AppShell, Footer).
- `src/components/ui/`: Reusable, atomic design system components (Button, Badge, Card, Banner).
- `src/lib/firebase/`: Modular Firebase Web SDK client initialization, auth, firestore, and storage helpers.
- `src/lib/auth/`: Authentication contexts, hooks, and session managers.
- `src/lib/utils/`: Generic utility helpers (e.g. `cn()` for Tailwind class merging).
- `src/types/`: System-wide TypeScript type definitions.
- `functions/`: Cloud Functions backend logic and microservices.
- `tests/`: Automated unit and integration tests.
- `docs/`: Comprehensive architectural, data, and security documentation.

### 1.3. UI & Styling Rules
- Adhere strictly to the Malaysian government design language guidelines: high readability, robust contrast ratios, clean typography, purposeful spacing, and no distracting animations or excessive gradients.
- Always provide accessible ARIA attributes, semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`), and keyboard navigation support.

---

## 2. Firebase Configuration & Environment Rules

### 2.1. Environment Variables
- Never hard-code Firebase configuration keys in source code.
- Always use `process.env.NEXT_PUBLIC_FIREBASE_*` variables.
- Maintain `.env.local.example` up to date with any newly added configuration parameters.
- Ensure `.env.local` is listed in `.gitignore` and never committed to version control.

### 2.2. Firebase Local Emulator Suite
- For local development and testing, run the Firebase Local Emulator Suite:
  ```bash
  npm run emulators
  ```
- Configure `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local` to point the client SDK to localhost emulator ports:
  - Auth: `9099`
  - Firestore: `8080`
  - Storage: `9199`
  - Functions: `5001`
  - Emulator UI: `4000`

---

## 3. Development Workflow & Git Etiquette

### 3.1. Standard Scripts
- `npm run dev`: Launch Next.js local development server (port 3000).
- `npm run build`: Compile production Next.js build and verify static generation.
- `npm run lint`: Run ESLint to detect stylistic or syntax issues.
- `npm run typecheck`: Run TypeScript compiler type checking without emitting files.
- `npm run test`: Run automated test suites.
- `npm run emulators`: Launch Firebase Local Emulator Suite.

### 3.2. Verification Before Commit
Every feature branch or module must satisfy the quality gate:
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
All commands must exit with code 0 before code review or merge.
