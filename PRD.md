# PRD — Roster-Gate

## Product Requirements Document

### 1. Product Vision

A React web app that prevents attendance fraud in university classrooms by implementing multi-layered security verification: dynamic QR codes with TTL, hardware-bound device fingerprinting, and WiFi subnet whitelisting. Features a simulation sandbox for live security demos.

### 2. Target Users

- BCA final-year students (academic evaluation project)
- Three user roles: Student, Teacher, Admin
- Single-user-per-device model

### 3. Core Features

| ID | Feature | Description |
|----|---------|-------------|
| F1 | Auth | Email/password login against Supabase users table |
| F2 | Student Portal | Biometric registration, QR scanner, attendance history |
| F3 | Teacher Portal | Start/end sessions, broadcast dynamic QR codes, roster grid |
| F4 | Admin Portal | User management, audit logs, device unbind, factory reset |
| F5 | Security Engine | QR generation/verification, subnet check, fingerprint verify |
| F6 | Simulation Sandbox | IP spoof, clock drift, live diagnostics for demos |
| F7 | Password Reset | EmailJS 6-digit code flow with 10-min TTL |

### 4. Non-Goals

- Real-time multi-user collaboration
- Video recording or processing
- Calendar integration
- Custom backend server beyond Supabase
- Production-grade password hashing
- Mobile native app

### 5. Success Criteria

- Student can register device via WebAuthn and mark attendance by scanning QR
- Teacher can start session, broadcast rotating QR codes, view live roster
- Admin can manage users, view audit logs, unbind devices
- Security defenses block: remote access, screenshot sharing, account sharing
- Simulation panel demonstrates all attack vectors and defenses

### 6. Constraints

- Supabase (Postgres + Auth) is the entire backend
- SPA, client-rendered — no SSR
- No react-router — state-based view switching
- Target Chrome/Edge for WebAuthn and QR scanning
- Academic demo scope — security trade-offs documented

### 7. Known Limitations

- Passwords stored in plaintext (no hashing)
- No Row Level Security policies enforced
- QR window is 15s but may be documented as 5s
- Chart data is mocked, not live from database
- WebAuthn requires HTTPS in production
- No email verification on signup
