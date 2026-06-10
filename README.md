# Secure Password Manager

A free, open-source password manager with client-side AES-256 encryption, TOTP-based MFA, and full code transparency.

**Status:** CS 467 Online Capstone — Spring 2026  
**Live:** https://vault.neuralnetworks.me/    
**User Guide:** [User Guide](documents/UserGuide.pdf)

---

## Project Vision

The Secure Password Manager demonstrates that password management doesn't require trusting a third-party. By publishing source code and encrypting on the client-side, users can:

- **Verify security independently** — full transparency, no black-box algorithms
- **Own their data** — credentials encrypted before leaving the browser; server stores ciphertext only
- **Eliminate costs** — free, no subscription
- **Learn modern security** — understand cryptography, authentication, and secure UI patterns in practice

---

## Core Features

- **Secure Registration & Login** — bcrypt hashing, plaintext never stored
- **Multi-Factor Authentication** — TOTP via RFC 6238 (Google Authenticator, Authy, etc.)
- **Brute Force Protection** — 15-minute lockout after 5 failed login attempts
- **Credential Vault** — full CRUD with AES-256 client-side encryption
- **Organization** — categories, search, and filter
- **Password Generator** — configurable length/character types, direct vault integration
- **Responsive Design** — mobile, tablet, desktop

---

## Team

| Name | Role | Responsibilities |
|---|---|---|
| **Matthew Clarke** | Frontend Lead | React UI, responsive design, client-side encryption, password generator, JWT in-browser, MFA flows |
| **Thania Cisneros** | Security & Backend Lead | Express API, auth endpoints, Mongoose schemas, TOTP integration, vault CRUD, security hardening |
| **Eduardo Jr Perez** | Infrastructure Lead | AWS EC2, CloudFront, HTTPS/ACM, DocumentDB, Nginx, CI/CD, integration testing |

---

## Architecture

### Client-Side Encryption

```
Master Password (in-memory only)
    ↓
PBKDF2(password, salt, 100k iterations) → Key
    ↓
AES-256(credential, key, IV) → Ciphertext
    ↓
Send { ciphertext, iv, salt } to server
```

**Security Properties:**
- Master password never sent to server; only bcrypt hash stored
- Unique salt and IV per credential
- 100k PBKDF2 iterations resist brute force
- Decryption requires master password

### Authentication

1. Registration: Master password bcrypt-hashed (12 rounds)
2. Login: Password verified; JWT issued if correct
3. MFA: TOTP verification required before JWT acceptance
4. Protected Routes: All vault operations require valid JWT
5. Lockout: 5 failed attempts → 15-minute account lockout

### Security Controls

- **Network:** HTTPS/TLS, CORS, HSTS (1 year), CSP headers
- **Validation:** Server-side input validation, strong password (12+ chars, upper, lower, number, special)
- **Injection Prevention:** Input validation via authMiddleware, XSS prevention via React auto-escaping
- **Secrets:** No plaintext logging, environment variables never committed
- **Database:** DocumentDB access restricted to backend EC2 security group only

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, Axios, CryptoJS 4 |
| **Backend** | Node.js, Express 5, Mongoose, bcrypt, jsonwebtoken |
| **MFA** | speakeasy (TOTP) |
| **Database** | Amazon DocumentDB |
| **Infrastructure** | AWS EC2 (3 instances), Nginx, PM2, CloudFront, ACM |
| **CI/CD** | GitHub Actions |

---

## Project Structure

```
secure-password-manager/
├── frontend/                   # React SPA (Matthew Clarke)
│   ├── src/
│   │   ├── pages/              # Login, Register, MFAPrompt, MFASetup, Vault
│   │   ├── components/         # PasswordGenerator
│   │   ├── styles/             # CSS Modules
│   │   └── utils/crypto.js     # AES-256 encryption
│   └── vite.config.js
├── backend/                    # Express API (Thania Cisneros)
│   ├── middleware/             # authMiddleware, internalAuthMiddleware
│   ├── models/                 # User, Credentials
│   ├── routes/                 # auth, credentials, internal (TOTP service)
│   └── server.js
├── totp/                       # TOTP Service (Thania + Eduardo)
│   ├── controllers/totpController.js
│   ├── routes/totpRoutes.js
│   └── server.js
├── .github/workflows/          # GitHub Actions CI/CD
└── documents/
    ├── CLAUDE.md               # Team decision log
    ├── schema-handoff.md       # Database schema
    └── totp-architecture.md    # TOTP service design
```

---

## Getting Started

### Prerequisites
- Node.js v20+
- npm/yarn
- Git

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev  # http://localhost:5173
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Set: JWT_SECRET, MONGO_URI, TOTP_INTERNAL_SECRET
npm run dev  # http://localhost:5000
```

### TOTP Service
```bash
cd totp
npm install
cp .env.example .env
# Set: BACKEND_API_URL, TOTP_INTERNAL_SECRET
npm run dev  # http://localhost:4000
```

### Test Locally
1. Register at http://localhost:5173
2. Scan QR code with authenticator app
3. Complete MFA setup
4. Log in and add credentials to vault

---

## Deployment

Pushing to `main` automatically triggers GitHub Actions:
- Changes in `frontend/` → deploys to Frontend EC2
- Changes in `backend/` → deploys to Backend EC2
- Changes in `totp/` → deploys to TOTP EC2

---

## Known Limitations

- **PBKDF2 Performance:** 100k iterations per credential (~50ms) means 100 credentials ≈ 2.5s unlock time. Potential fix: single per-account key derivation (deferred).
- **Session Persistence:** Master password stored in React state only; page reload requires re-entry. By design for security.

---

## Contributing

This is a CS 467 capstone project. Outside contributions are not being accepted at this time.

---

**Built by the CS 467 Capstone Team — Spring 2026**
