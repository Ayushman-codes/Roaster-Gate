# Roster-Gate — Build Context for AI Coding Agent

> Paste this entire file as the project brief/system context before asking an agent
> (Claude Code, Cursor, Windsurf, v0, etc.) to scaffold or build this app. It is
> self-contained: stack, schema, contracts, file layout, and feature specs with
> acceptance criteria. Do not ask the user to re-explain anything covered below —
> follow it directly and ask only about genuine gaps.

## 1. Project Overview

**Name:** Roster-Gate (Secure Attendance Tracking System)
**What it is:** A React web app that prevents attendance fraud in university classrooms
by implementing multi-layered security verification: dynamic QR codes with TTL,
hardware-bound device fingerprinting (WebAuthn), and WiFi subnet whitelisting.
Includes a simulation sandbox for live security demos.

**Scope:** Three user roles (Student, Teacher, Admin). Single-user-per-device model.
Built for academic (BCA final-year) evaluation — prioritize working security pipeline
over exhaustive edge-case handling.

**Non-goals (do not build unless explicitly asked):** real-time multi-user collaboration,
video recording, calendar integration, custom backend server, production-grade password
hashing, mobile native app.

## 2. Tech Stack (exact)

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite 8, Tailwind CSS 4 |
| Routing | State-based (no react-router) |
| Database / Auth | Supabase (`@supabase/supabase-js`) |
| QR Generation | `qrcode.react` (QRCodeSVG component) |
| QR Scanning | `@zxing/browser` + `@zxing/library` |
| Charts | Recharts (AreaChart, PieChart) |
| Icons | Lucide React |
| Email | EmailJS (`@emailjs/browser`) for password reset |
| Biometric | WebAuthn API (native browser `navigator.credentials`) |
| Hosting | Vercel |

## 3. Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

Note: Supabase anon key is used client-side. Accepted trade-off for academic demo.
EmailJS public key is safe to expose.

## 4. Database Schema (Supabase / Postgres)

```sql
-- Users table (students, teachers, admins)
create table users (
  id text primary key,           -- e.g., 'BCA/40051/24'
  name text not null,
  email text unique not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  password text not null,        -- plaintext (known limitation)
  registeredFingerprint text    -- WebAuthn credential ID, null if not registered
);

-- Subjects table
create table subjects (
  id text primary key,           -- e.g., 'CS-101'
  name text not null,
  teacherId text references users(id),
  subnet text not null,          -- e.g., '192.168.1.*'
  schedule text,
  room text
);

-- Sessions table (attendance sessions created by teachers)
create table sessions (
  id text primary key,           -- 'sess_' + UUID
  subjectId text references subjects(id),
  teacherId text references users(id),
  createdAt bigint not null
);

-- Attendance table
create table attendance (
  id text primary key,           -- 'att_' + UUID
  studentId text references users(id),
  studentName text,
  sessionId text references sessions(id),
  subjectId text references subjects(id),
  subjectName text,
  timestamp bigint not null,
  status text not null,          -- 'Present' or 'Late'
  ipAddress text,
  fingerprint text,
  method text                    -- e.g., 'Biometric QR Verified'
);

-- Audit logs table
create table audit_logs (
  id text primary key,           -- 'log_' + UUID
  timestamp bigint not null,
  level text not null,           -- 'INFO', 'WARN', 'CRITICAL'
  message text not null,
  details text
);

-- Password resets table
create table password_resets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,            -- 6-digit numeric
  expires_at bigint not null,    -- unix timestamp (10 min TTL)
  used boolean default false,
  created_at bigint default (extract(epoch from now()) * 1000)
);
```

## 5. Data Contracts (TypeScript-style, for reference even in a .jsx codebase)

```ts
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  password: string;
  registeredFingerprint: string | null;
}

interface Subject {
  id: string;
  name: string;
  teacherId: string;
  subnet: string;
  schedule: string;
  room: string;
}

interface Session {
  id: string;
  subjectId: string;
  teacherId: string;
  createdAt: number;
}

interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  subjectId: string;
  subjectName: string;
  timestamp: number;
  status: 'Present' | 'Late';
  ipAddress: string;
  fingerprint: string;
  method: string;
}

interface AuditLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'CRITICAL';
  message: string;
  details: string;
}

interface QrPayload {
  sessionId: string;
  timestamp: number;
  salt: string;
}
```

## 6. File / Folder Structure

```
roaster-gate/
  src/
    state/
      supabaseClient.js         -- Supabase client init
      db.js                     -- Core business logic, DB queries, security engine
    components/
      Login.jsx                 -- Email/password login form
      ForgotPassword.jsx        -- 3-step password reset via EmailJS
      StudentDashboard.jsx      -- Student portal (scanner, biometric, history)
      TeacherDashboard.jsx      -- Teacher portal (QR broadcast, roster, charts)
      AdminDashboard.jsx        -- Admin portal (users, audit logs, danger zone)
      SimulationPanel.jsx       -- Floating security sandbox for attack simulation
    App.jsx                     -- Top-level layout, routing, auth state
    main.jsx                    -- React root mount
    index.css                   -- Tailwind imports + custom theme classes
  .env                          -- Environment variables
  package.json
  vite.config.js
```

## 7. Feature Specs & Acceptance Criteria

**F1 — Auth**
- Email/password login against Supabase users table.
- Unauthenticated users see Login.jsx; authenticated users see role-based dashboard.
- Done when: user can log in, sees correct dashboard for their role, can log out.

**F2 — Student Portal**
- Biometric registration via WebAuthn (Touch ID / Face ID / security key).
- QR code scanning via device camera or image upload.
- Manual token injection for testing.
- Attendance history table showing subject, status, IP, method, timestamp.
- Done when: student registers device, scans QR, sees attendance recorded.

**F3 — Teacher Portal**
- Start/end attendance sessions for a subject.
- Broadcast dynamic QR codes that rotate every 15 seconds.
- Live roster grid showing all students with attendance status.
- Manual override buttons (Present/Late/Absent).
- Done when: teacher starts session, QR rotates, student can scan, roster updates.

**F4 — Admin Portal**
- Add new users (student/teacher) with form.
- View all users with device binding status.
- Unbind device fingerprints (allows re-registration).
- Delete users.
- View system security audit logs.
- Factory reset: wipe attendance, sessions, logs, clear all bindings.
- Done when: admin can manage users, view logs, perform reset.

**F5 — Security Engine**
- QR token generation: base64-encoded {sessionId, timestamp, salt}.
- QR verification: decode, check age (2x window = 30s tolerance), reject expired.
- Subnet verification: compare client IP against course subnet prefix.
- Biometric verification: WebAuthn assertion flow.
- Duplicate detection: prevent same student marking twice per session.
- Audit logging: all security events recorded.
- Done when: all three attack vectors (remote, screenshot, account sharing) are blocked.

**F6 — Simulation Sandbox**
- Floating panel accessible from any logged-in view.
- Simulate Client IP with preset subnets and custom input.
- Clock offset slider for TTL expiry simulation.
- Live diagnostic feed showing current state.
- State persists in localStorage.
- Done when: attacker can spoof IP/clock and see defenses block the attempts.

**F7 — Password Reset**
- 3-step flow: Request → Verify → Success.
- 6-digit code sent via EmailJS with 10-minute expiry.
- New password validation (min 6 chars, must match confirmation).
- Done when: user receives email, enters code, sets new password, can log in.

## 8. Routes (State-based)

| View State | Component | Auth Required |
|---|---|---|
| `view === "login"` | `Login.jsx` | no |
| `view === "forgotPassword"` | `ForgotPassword.jsx` | no |
| `user.role === "student"` | `StudentDashboard.jsx` | yes |
| `user.role === "teacher"` | `TeacherDashboard.jsx` | yes |
| `user.role === "admin"` | `AdminDashboard.jsx` | yes |
| Always (when logged in) | `SimulationPanel.jsx` | yes |

## 9. Build Order

1. Supabase project + create tables + enable email/password auth.
2. supabaseClient.js + db.js fetchers + Login.jsx + App.jsx auth state.
3. StudentDashboard.jsx + WebAuthn registration + QR scanning.
4. TeacherDashboard.jsx + QR generation + session management.
5. Security engine: QR verification, subnet check, fingerprint verify.
6. AdminDashboard.jsx + user CRUD + audit logs + factory reset.
7. SimulationPanel.jsx + IP spoof + clock drift + diagnostics.
8. ForgotPassword.jsx + EmailJS integration + password reset flow.
9. Polish: loading states, error handling, clean build.
10. Deploy to Vercel.

## 10. Constraints / Non-Negotiables

- No custom backend server — Supabase is the entire backend.
- No react-router — state-based view switching in App.jsx.
- SPA, client-rendered; no SSR requirement.
- Target Chrome/Edge for WebAuthn and QR scanning.
- Keep security verification pipeline strict — never silently bypass checks.

## 11. Known Limitations (document these, don't attempt silent fixes)

- Passwords stored in plaintext (no hashing).
- No Row Level Security policies enforced.
- Chart data in teacher dashboard is mocked, not live.
- QR window is 15s but may be documented as 5s.
- WebAuthn requires HTTPS in production.
- No email verification on signup.
- Supabase anon key exposed in client bundle.
