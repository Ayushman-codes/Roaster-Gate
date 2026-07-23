# MEMORY.md — Roster-Gate

## Project Memory

### Build Log

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| 0 — Init | Done | 2026-07-13 | Vite scaffold, Tailwind CSS v4, deps installed |
| 1 — Auth & DB | Done | 2026-07-13 | Supabase client, users table, login form |
| 2 — Student Portal | Done | 2026-07-13 | Biometric registration, QR scanner, attendance log |
| 3 — Teacher Portal | Done | 2026-07-13 | Session management, QR broadcast, roster grid |
| 4 — Admin Portal | Done | 2026-07-13 | User management, audit logs, danger zone |
| 5 — Security Engine | Done | 2026-07-13 | QR generation, subnet check, fingerprint verify |
| 6 — Simulation Panel | Done | 2026-07-13 | IP spoof, clock drift, live diagnostics |
| 7 — Password Reset | Done | 2026-07-23 | EmailJS integration, 6-digit code flow |
| 8 — Polish | Done | 2026-07-23 | Error states, loading spinners, clean build |

### Files Created

```
src/
  state/
    supabaseClient.js         — Supabase client init
    db.js                     — Core business logic, DB queries, security engine
  components/
    Login.jsx                 — Email/password login form
    ForgotPassword.jsx        — 3-step password reset via EmailJS
    StudentDashboard.jsx      — Student portal (scanner, biometric, history)
    TeacherDashboard.jsx      — Teacher portal (QR broadcast, roster, charts)
    AdminDashboard.jsx        — Admin portal (users, audit logs, danger zone)
    SimulationPanel.jsx       — Floating security sandbox for attack simulation
  App.jsx                     — Top-level layout, routing, auth state
  main.jsx                    — React root mount
  index.css                   — Tailwind imports + custom JUNO theme classes
```

### Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

### Decisions Made

1. Using React 19 (not 18) — latest stable at build time
2. Tailwind CSS v4 with @tailwindcss/vite plugin — not v3 PostCSS setup
3. No TypeScript — JSX only
4. No react-router — view switching via React state in App.jsx
5. Supabase is the only backend — no custom server
6. Client-side Supabase queries — no Edge Functions or API routes
7. Passwords stored in plaintext — acceptable for academic demo scope
8. QR window is 15 seconds (QR_WINDOW_MS = 15000)
9. EmailJS for password reset emails — not Supabase Auth
10. WebAuthn for biometric device binding — native browser API
11. Simulation state persists in localStorage

### Known Issues

1. Passwords stored in plaintext (no hashing)
2. Supabase anon key exposed in .env (accepted trade-off for demo)
3. Chart data in teacher dashboard is mocked, not live
4. No Row Level Security policies visible in codebase
5. QR window is 15s but README says 5s — docs need update
