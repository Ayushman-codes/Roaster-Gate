# PHASES.md — Roster-Gate

## Build Phases

### Phase 0 — Project Initialization
**Status:** Done

- Scaffolded Vite + React project
- Installed dependencies: @supabase/supabase-js, qrcode.react, @zxing/browser, recharts, lucide-react, @emailjs/browser
- Installed Tailwind CSS v4 with @tailwindcss/vite plugin
- Created directory structure: src/{components,state,assets}
- Created .env with Supabase and EmailJS credentials
- Created supabaseClient.js, db.js

### Phase 1 — Authentication & Database
**Status:** Done

- Created Supabase client initialization
- Created login form with email/password
- Created App.jsx with auth state management
- Configured view switching: login, forgotPassword, role-based dashboards

### Phase 2 — Student Portal
**Status:** Done

- Created StudentDashboard.jsx with three sections
- Biometric Device Registration: WebAuthn credential creation and storage
- Class Attendance Scanner: QR code scanning via @zxing/browser
- Attendance Log Registry: Table of past attendance records
- Added device fingerprint binding and verification

### Phase 3 — Teacher Portal
**Status:** Done

- Created TeacherDashboard.jsx with three sections
- QR Broadcast Controls: Subject selector, start/end session, live QR display
- Dynamic QR generation with 15-second rolling time windows
- Historical Dashboard Analytics: Area and Pie charts (mocked data)
- Live Class Roster & Override: Student grid with manual attendance buttons

### Phase 4 — Admin Portal
**Status:** Done

- Created AdminDashboard.jsx with four sections
- Add New User: Form for creating student/teacher accounts
- Student Device Registry: Table with bind status, unbind/delete actions
- System Security Logs: Scrollable audit log with INFO/WARN/CRITICAL levels
- Danger Zone: Factory reset that wipes attendance, sessions, logs, and bindings

### Phase 5 — Security Engine
**Status:** Done

- QR token generation: base64-encoded payload with sessionId, timestamp, salt
- QR verification: decode, check age (2x window = 30s tolerance), reject expired
- Subnet verification: compare client IP against course subnet prefix
- Biometric verification: WebAuthn assertion flow
- Duplicate detection: prevent same student marking twice per session
- Audit logging: all security events recorded with level and details

### Phase 6 — Simulation Sandbox
**Status:** Done

- Created SimulationPanel.jsx as floating bottom-right panel
- Simulate Client IP: preset subnets + custom input
- Clock Offset: slider from -15s to +15s for TTL expiry simulation
- Live Diagnostic Feed: current IP, offset, biometric status, active QR token
- State persists in localStorage under key sat_simulation

### Phase 7 — Password Reset
**Status:** Done

- Created ForgotPassword.jsx with 3-step flow
- Request: enter email, send 6-digit code via EmailJS
- Verify: enter code + new password, validate and update
- Success: confirmation message with back-to-login button
- Backend functions: sendResetCode, verifyResetCode, updatePassword in db.js

### Phase 8 — Polish & Error States
**Status:** Done

- Loading spinners on all forms
- Error banners with descriptive messages
- Empty states for no data
- Clean build with no warnings

### Next Steps (Manual)

1. Create Supabase project and configure tables
2. Enable email/password auth in Supabase
3. Set up EmailJS account and configure template
4. Fill in .env with real credentials
5. Test auth flow end-to-end
6. Test biometric registration on HTTPS
7. Test QR broadcast and scanning
8. Verify all security defenses work
9. Deploy to Vercel or similar hosting
