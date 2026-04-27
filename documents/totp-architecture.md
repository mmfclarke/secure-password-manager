# TOTP Service Architecture

**Author:** Matthew Clarke
**Branch:** `feat/matthew-totp_framework_suggestion`
**Date:** 2026-04-27

This document explains the structural decisions behind how the TOTP service is built and how it communicates with the backend. This branch is a reference implementation — not a merge target. Thania should use it as a guide when rewriting `feat/totp-service`.

---

## The Core Rule

**Only one service touches the database: the backend.**

The TOTP service runs on its own EC2 instance. It does not connect to DocumentDB. It does not import Mongoose. It does not define a User schema. All user data reads and writes go through the backend API over HTTP.

---

## Why

Two services writing directly to the same database creates fragile schema duplication. If the User schema changes (which it already did once during PR #2), both services have to be updated in sync. When that doesn't happen, you get field name mismatches, silent data corruption, and broken auth — which is exactly what happened in `feat/totp-service`.

By routing all DB operations through the backend:
- The User schema is defined in exactly one place: `backend/models/User.js`
- JWT issuance happens in exactly one place: the backend
- The TOTP service becomes a thin, focused service that only knows about TOTP

---

## Responsibility Split

| Concern | Owner |
|---|---|
| Database reads/writes | Backend |
| bcrypt (password hashing) | Backend |
| JWT issuance | Backend |
| TOTP secret generation | TOTP service |
| QR code generation | TOTP service |
| TOTP token verification | TOTP service |

---

## Service Communication

The TOTP service calls the backend via three internal endpoints, all protected with a shared secret header (`x-internal-secret`). These endpoints are not user-facing and should never be exposed publicly.

```
TOTP service ──── x-internal-secret header ────► Backend internal routes
                                                    └── reads/writes User document
                                                    └── issues JWT
```

### Internal endpoints (backend)

| Method | Path | Called by TOTP service when |
|---|---|---|
| `GET` | `/api/internal/users/:userId/totp-secret` | Verifying a TOTP token — needs the stored secret |
| `PUT` | `/api/internal/users/:userId/totp` | Setting up MFA — saves the generated secret |
| `POST` | `/api/internal/users/:userId/complete-mfa` | Verification passed — flip `mfaEnabled: true` and get JWT |

### Shared secret

Both services have `TOTP_INTERNAL_SECRET` in their `.env`. The backend validates this on every request to `/api/internal/*` via `internalAuthMiddleware.js`. This prevents any outside traffic from hitting the internal endpoints even if they discover the route.

---

## MFA Login Flow (end to end)

```
1. User submits email + password to frontend
2. Frontend → POST /api/auth/login (backend)
3. Backend verifies bcrypt, checks mfaEnabled
   └── if mfaEnabled: true → return { requireMFA: true, userId }
   └── if mfaEnabled: false → return { token } (normal login)
4. Frontend → POST /totp/verify (TOTP service) with { userId, token }
5. TOTP service → GET /api/internal/users/:userId/totp-secret (backend)
6. TOTP service runs speakeasy.totp.verify()
   └── if invalid → return 400
   └── if valid → continue
7. TOTP service → POST /api/internal/users/:userId/complete-mfa (backend)
8. Backend sets mfaEnabled: true, signs JWT, returns { token }
9. TOTP service passes { token } back to frontend
```

## MFA Setup Flow (end to end)

```
1. Frontend → POST /totp/setup (TOTP service) with { userId }
2. TOTP service generates speakeasy secret
3. TOTP service → PUT /api/internal/users/:userId/totp (backend) with { totpSecret }
4. Backend saves totpSecret to User document
5. TOTP service generates QR code from secret
6. TOTP service returns { qrCode } to frontend
7. User scans QR code in authenticator app
8. Frontend prompts user to verify with first TOTP code → goes through verify flow above
```

---

## File Structure

```
backend/
├── middleware/
│   ├── authMiddleware.js          # JWT auth for user-facing protected routes
│   └── internalAuthMiddleware.js  # Shared secret auth for TOTP service calls
├── models/
│   ├── User.js                    # Single source of truth for User schema
│   └── Credentials.js
├── routes/
│   ├── authRoutes.js              # POST /api/auth/register, POST /api/auth/login
│   └── internalRoutes.js         # Internal endpoints for TOTP service only
└── server.js

totp/
├── controllers/
│   └── totpController.js          # speakeasy logic + axios calls to backend
├── routes/
│   └── totpRoutes.js              # POST /totp/setup, POST /totp/verify
└── server.js                      # Express only — no mongoose, no DB connection
```

---

## Environment Variables

**Backend `.env`:**
```
JWT_SECRET=
PORT=5000
MONGO_URI=
MONGO_TLS_CA_FILE=
TOTP_INTERNAL_SECRET=
```

**TOTP service `.env`:**
```
PORT=4000
BACKEND_API_URL=
TOTP_INTERNAL_SECRET=
```

`TOTP_INTERNAL_SECRET` must be the same value in both `.env` files. `JWT_SECRET` lives only in the backend — the TOTP service never signs tokens.
