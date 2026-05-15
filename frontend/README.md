# Frontend — React SPA

React 19 single-page application for the Secure Password Manager. Handles authentication, MFA enrollment, and the encrypted credential vault UI.

**Responsibility:** Matthew Clarke

---

## Overview

The frontend is a client-side React application responsible for:
- User registration and login flows
- MFA enrollment (QR code generation) and verification
- Credential vault management (CRUD operations)
- Client-side AES-256 encryption/decryption
- Password generator modal
- Responsive design (mobile, tablet, desktop)

**Key Principle:** All credentials are encrypted client-side before transmission to the backend. The master password never leaves the browser.

---

## Architecture

### Pages
- **Login.jsx** — email + password input, JWT storage, navigation to MFA prompt
- **Register.jsx** — account creation, password strength requirements display
- **MFASetup.jsx** — QR code display for TOTP enrollment, verification prompt
- **MFAPrompt.jsx** — TOTP code input during each login
- **Vault.jsx** — credential list, add/edit/delete forms, search, category filter, copy actions

### Components
- **PasswordGenerator.jsx** — modal with configurable length/character types, copy to clipboard, direct vault integration

### Utilities
- **crypto.js** — AES-256 encryption/decryption via CryptoJS
  - `encrypt(data, masterPassword)` → `{ ciphertext, iv, salt }`
  - `decrypt(ciphertext, iv, salt, masterPassword)` → plaintext
  - Uses PBKDF2 (100k iterations) for key derivation

### State Management
- **App.jsx** — top-level state for `masterPassword`, JWT token, user session
- **React Router** — protected `/vault` route, public auth routes
- `masterPassword` stored in memory only; page reload requires re-entry (by design)

---

## Setup

### Prerequisites
- Node.js v20+
- npm/yarn

### Installation
```bash
cd frontend
npm install
cp .env.example .env
```

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_TOTP_SERVICE_URL=http://localhost:4000
```

For production, these point to the live API and TOTP service URLs.

### Development
```bash
npm run dev
# Runs on http://localhost:5173
```

### Build
```bash
npm run build
# Output to dist/
```

---

## Key Files

```
src/
├── pages/
│   ├── Login.jsx              # Email + password login
│   ├── Register.jsx           # Account creation + password strength UI
│   ├── MFASetup.jsx           # TOTP enrollment (QR + verification)
│   ├── MFAPrompt.jsx          # TOTP code input
│   └── Vault.jsx              # Credential management
├── components/
│   └── PasswordGenerator.jsx   # Configurable password generator
├── styles/
│   ├── Login.module.css
│   ├── Register.module.css
│   ├── MFASetup.module.css
│   ├── MFAPrompt.module.css
│   ├── PasswordGenerator.module.css
│   └── Vault.module.css       # Includes responsive design (768px, 640px breakpoints)
├── utils/
│   └── crypto.js              # AES-256 encrypt/decrypt
├── App.jsx                    # Router, protected routes, state lifting
└── main.jsx                   # React entry point
```

---

## Security Considerations

### Encryption
- **Master password** — in-memory only, never logged, never sent to server
- **Credentials** — encrypted with AES-256 before HTTP transmission
- **Key derivation** — PBKDF2 with 100k iterations per credential for brute-force resistance
- **Unique salt/IV** — each credential has unique encryption parameters

### Session Management
- **JWT token** — stored in memory, sent in Authorization header
- **Page reload** — vault unlock overlay prompts for master password re-entry (no full logout)
- **Logout** — clears token and master password from state

### Input Handling
- **Password requirements** — validated client-side and server-side
  - Minimum 12 characters
  - Uppercase, lowercase, number, special character
- **React auto-escaping** — JSX prevents XSS by default; no innerHTML usage
- **HTTPS only** — clipboard operations require HTTPS or localhost

---

## Common Tasks

### Adding a New Route
1. Create page in `src/pages/`
2. Register in `App.jsx` router
3. Use `useNavigate()` for navigation

### Updating Encryption Logic
- Modify `src/utils/crypto.js`
- Test backward compatibility (old ciphertexts must still decrypt)
- Update both encrypt and decrypt functions in tandem

### Styling
- CSS Modules only (scoped per page/component)
- BEM-like naming: `blockName`, `blockName__element`, `blockName--modifier`
- Responsive breakpoints: 768px (tablet), 640px (mobile)

### API Communication
- Use Axios with relative paths (e.g., `/api/auth/login`)
- Nginx proxy on backend EC2 routes `/api/*` to backend service
- Include JWT in Authorization header for protected routes

---

## Testing Checklist

**Before committing:**
- [ ] Login/register flow works
- [ ] MFA enrollment and verification work
- [ ] Vault CRUD operations work
- [ ] Copy to clipboard works
- [ ] Password generator integration works
- [ ] Responsive design looks correct on mobile/tablet/desktop
- [ ] No console errors
- [ ] No plaintext passwords logged

---

## Dependencies

Key packages:
- **react** (19.x) — UI framework
- **react-router-dom** (7.x) — routing
- **axios** — HTTP client
- **cryptojs** (4.x) — AES-256 encryption
- **lucide-react** — icons
- **vite** — build tool

See `package.json` for full list and versions.

---

**Maintained by Matthew Clarke**
