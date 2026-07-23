# ARCHITECTURE.md — Roster-Gate

## System Architecture

### Overview

```
┌─────────────────────────────────────────────────┐
│                React SPA (Vite)                 │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Pages    │  │Components│  │   State      │  │
│  │ Login     │  │ Student  │  │ supabase     │  │
│  │ ForgotPW  │  │ Teacher  │  │   Client.js  │  │
│  │           │  │ Admin    │  │ db.js        │  │
│  │           │  │ SimPanel │  │              │  │
│  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        │              │               │          │
│  ┌─────┴──────────────┴───────────────┴───────┐  │
│  │              Security Engine               │  │
│  │  QR Verify │ Subnet Check │ Biometric Check│  │
│  │  Audit Log │ Duplicate Detection           │  │
│  └──────┬──────────────┬──────────────────────┘  │
└─────────┼──────────────┼────────────────────────┘
          │              │
    ┌─────▼─────┐  ┌─────▼──────┐  ┌──────────────┐
    │ Supabase  │  │ EmailJS    │  │ WebAuthn     │
    │ Auth      │  │ (Password  │  │ (Browser     │
    │ Database  │  │  Reset)    │  │  API)        │
    └───────────┘  └────────────┘  └──────────────┘
```

### Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite 8, Tailwind CSS 4 |
| Routing | State-based (App.jsx view state) |
| Database / Auth | Supabase (@supabase/supabase-js) |
| QR Generation | qrcode.react (QRCodeSVG) |
| QR Scanning | @zxing/browser + @zxing/library |
| Charts | Recharts (AreaChart, PieChart) |
| Icons | Lucide React |
| Email | EmailJS (@emailjs/browser) |
| Biometric | WebAuthn API (navigator.credentials) |
| Hosting | Vercel |

### Data Flow

1. **Auth** → Login form queries Supabase users table → sets user state in App.jsx
2. **Role Routing** → App.jsx renders StudentDashboard / TeacherDashboard / AdminDashboard based on user.role
3. **Student Attendance** → Scan QR → decode token → verify biometric → check subnet → check QR age → check duplicate → insert attendance
4. **Teacher Session** → Start session → generate QR payload every 15s → broadcast QRCodeSVG → students scan
5. **Admin Management** → CRUD users → view audit logs → unbind devices → factory reset
6. **Password Reset** → Request code → send via EmailJS → verify code → update password
7. **Simulation** → Override IP/clock → feed into security engine → see defenses block attempts

### Security Pipeline (verifyAndSubmitAttendance)

```
1. Decode base64 token → extract {sessionId, timestamp, salt}
2. Look up session → get subjectId → get subnet
3. Verify biometric → compare credential ID against user.registeredFingerprint
4. Check QR age → |now - timestamp| < 2 * QR_WINDOW_MS (30s tolerance)
5. Check subnet → client IP matches course subnet prefix
6. Check duplicate → no existing attendance for this student + session
7. Insert attendance record → write audit log → return success
```

### Database Tables

- `users` — one per person, role-based (student/teacher/admin), holds fingerprint
- `subjects` — courses with teacher, subnet, schedule, room
- `sessions` — attendance sessions created by teachers, linked to subject
- `attendance` — one per student per session, with status, IP, method, timestamp
- `audit_logs` — security events with level (INFO/WARN/CRITICAL)
- `password_resets` — 6-digit codes with 10-minute TTL

### Component Architecture

```
App.jsx
├── Login.jsx (when not logged in)
├── ForgotPassword.jsx (when not logged in + view === "forgotPassword")
├── StudentDashboard.jsx (when role === "student")
│   ├── Biometric Registration section
│   ├── QR Scanner section
│   └── Attendance Log section
├── TeacherDashboard.jsx (when role === "teacher")
│   ├── QR Broadcast Controls section
│   ├── Analytics section
│   └── Roster Grid section
├── AdminDashboard.jsx (when role === "admin")
│   ├── Add User form
│   ├── Device Registry table
│   ├── Audit Logs table
│   └── Danger Zone
└── SimulationPanel.jsx (always when logged in)
    ├── IP Spoof controls
    ├── Clock Offset controls
    └── Live Diagnostic feed
```

### Security Model

- **Device Fingerprinting**: WebAuthn credential ID bound to user account
- **Subnet Whitelisting**: Each subject has authorized IP prefix
- **Dynamic QR TTL**: 15-second rolling window, 30-second tolerance
- **Audit Logging**: All security events recorded with severity level
- **No RLS**: All queries are client-side, no Row Level Security enforced
- **Plaintext Passwords**: Known limitation for academic demo scope
