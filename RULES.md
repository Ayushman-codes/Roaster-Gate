# RULES.md — Roster-Gate

## Development Rules

### Code Style

1. **No comments** in code unless explicitly requested
2. **Functional components** only — no class components
3. **Tailwind CSS** for all styling — no CSS modules, no styled-components
4. **JSX** files — not TSX
5. **Default exports** for components

### File Naming

- Components: `src/components/PascalCase.jsx`
- State: `src/state/camelCase.js`
- Assets: `src/assets/camelCase.{png,svg}`

### Data Rules

1. **Supabase is the only backend** — no custom server
2. **Client-side queries** — all DB operations from the browser
3. **Client-side API keys** — acceptable for academic demo
4. **Plaintext passwords** — documented as known limitation
5. **localStorage** for simulation state persistence

### Security Rules

1. **QR tokens rotate every 15 seconds** — QR_WINDOW_MS = 15000
2. **Biometric verification via WebAuthn** — native browser API only
3. **Subnet check** — compare client IP against course subnet prefix
4. **Audit logging** — all security events logged to audit_logs table
5. **Device binding** — one device per student, admin can unbind

### AI/Email Rules

1. **EmailJS for password reset** — not Supabase Auth
2. **6-digit numeric codes** — 10-minute expiry
3. **Template variables must match** — to_email, reset_code, app_name

### Git Rules

1. **Never commit secrets** — .env is gitignored
2. **Concise commit messages** matching repo style
3. **Only commit when explicitly asked**

### Testing

- Build must pass (`npm run build`) before any commit
- Run `npm run lint` if linting is configured
- Manual testing in Chrome/Edge for WebAuthn and QR features

### Known Limitations (Do Not Fix Silently)

1. Passwords stored in plaintext
2. No Row Level Security policies
3. Chart data is mocked
4. QR window documentation mismatch (15s vs 5s)
5. WebAuthn requires HTTPS in production
