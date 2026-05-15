# TOTP Service — MFA Verification

Stateless TOTP (Time-based One-Time Password) service for multi-factor authentication. Generates QR codes for authenticator apps and verifies 6-digit codes during login.

**Responsibility:** Thania Cisneros & Eduardo Jr Perez

---

## Overview

The TOTP service provides endpoints for:
- Generating TOTP secrets and QR codes during MFA enrollment
- Verifying TOTP codes during login

**Architecture Decision:** This service does NOT connect to DocumentDB. All user data reads/writes go through the backend API via internal endpoints (protected by shared secret). This keeps the TOTP service stateless and simplifies deployment.

**Flow:**
1. User registers → backend generates TOTP secret
2. User navigates to `/mfa-setup` → frontend calls `/totp/setup` → backend API lookups TOTP secret → TOTP service returns QR code
3. User scans QR → authenticator app begins generating 6-digit codes
4. User enters 6-digit code → frontend calls `/totp/verify` → TOTP service verifies against RFC 6238 spec → backend API marks MFA as complete

---

## Setup

### Prerequisites
- Node.js v20+
- npm/yarn

### Installation
```bash
cd totp
npm install
cp .env.example .env
```

### Environment Variables
```env
PORT=4000
BACKEND_API_URL=http://localhost:5000
TOTP_INTERNAL_SECRET=<shared-secret-with-backend>
```

**For production:**
```env
PORT=4000
BACKEND_API_URL=https://api.vault.neuralnetworks.me
TOTP_INTERNAL_SECRET=<same-value-as-backend>
```

### Development
```bash
npm run dev
# Runs on http://localhost:4000
```

### Production
```bash
npm run start
# Runs on specified PORT
```

---

## API Endpoints

### POST /totp/setup
Generate TOTP secret and QR code for new user.

**Request:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Flow:**
1. Call backend `/internal/users/:userId/totp` to get TOTP secret
2. Generate QR code using speakeasy
3. Return QR to frontend

---

### POST /totp/verify
Verify a 6-digit TOTP code during login.

**Request:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "token": "123456"
}
```

**Response (200):**
```json
{
  "valid": true,
  "message": "TOTP verified successfully"
}
```

**Error (400):**
```json
{
  "error": "Invalid TOTP code"
}
```

**Flow:**
1. Call backend `/internal/users/:userId/totp` to get stored TOTP secret
2. Verify 6-digit code matches current time window via speakeasy
3. Return result to frontend
4. If valid, frontend navigates to vault with JWT

---

## Key Files

```
├── controllers/
│   └── totpController.js        # speakeasy logic, backend API calls
├── routes/
│   └── totpRoutes.js            # POST /setup, POST /verify
├── middleware/
│   └── internalAuthMiddleware.js # x-internal-secret validation (shared with backend)
├── server.js                    # Express setup
└── package.json
```

---

## Security

- **No Database Connection** — all data fetched from backend API
- **Internal Auth** — requests to backend use `x-internal-secret` header (shared secret)
- **TOTP Window** — accepts codes within 30-second window (RFC 6238 compliant)
- **No Logging** — TOTP secrets and codes never logged
- **Stateless** — each request is independent; no session storage

---

## Common Tasks

### Testing Locally
```bash
# Start TOTP service
npm run dev

# In another terminal, test setup endpoint
curl -X POST http://localhost:4000/totp/setup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }'

# Response includes QR code (base64) and secret
```

### Verifying a TOTP Code
```bash
curl -X POST http://localhost:4000/totp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "token": "123456"
  }'
```

### Backend API Errors
If the service can't reach the backend:
- Verify `BACKEND_API_URL` is correct
- Verify `TOTP_INTERNAL_SECRET` matches backend env var
- Check backend is running: `curl http://localhost:5000/health`

---

## RFC 6238 Compliance

The service uses speakeasy for TOTP generation/verification:
- **Time step:** 30 seconds
- **Window:** current and adjacent time steps (±30 seconds)
- **Algorithm:** HMAC-SHA1
- **Digits:** 6

This ensures compatibility with standard authenticator apps (Google Authenticator, Authy, Microsoft Authenticator, etc.).

---

## Deployment

### EC2 Instance
1. SSH into TOTP EC2 instance
2. Pull latest code: `git pull origin main`
3. Install dependencies: `npm ci`
4. Restart via PM2: `pm2 restart totp-service`
5. Verify logs: `pm2 logs totp-service`

### Environment
- PM2 manages process lifecycle
- Logs stored via `pm2 logs`
- Auto-restart on crash enabled

---

## Testing Checklist

**Before committing:**
- [ ] `/totp/setup` generates valid QR code
- [ ] Generated secret works with authenticator app
- [ ] `/totp/verify` accepts valid 6-digit codes
- [ ] `/totp/verify` rejects invalid codes
- [ ] Backend API communication works
- [ ] x-internal-secret validation works
- [ ] Service restarts gracefully
- [ ] No TOTP secrets logged

---

## Dependencies

Key packages:
- **express** — web framework
- **speakeasy** — TOTP spec implementation (RFC 6238)
- **qrcode** — QR code generation
- **axios** — HTTP client for backend API calls

See `package.json` for full list and versions.

---

## Architecture Diagram

```
Frontend (localhost:5173)
    ↓ POST /totp/setup
TOTP Service (localhost:4000)
    ↓ GET /internal/users/:userId/totp (header: x-internal-secret)
Backend API (localhost:5000)
    ↓ lookup User.totpSecret in DocumentDB
    ↑ return secret
TOTP Service
    ↓ speakeasy.generateSecret() + qrcode.toDataURL()
    ↑ return { secret, qrCode }
Frontend
    ↓ display QR code, user scans
    ↓ POST /totp/verify with 6-digit code
TOTP Service
    ↓ GET /internal/users/:userId/totp
Backend API
    ↓ lookup User.totpSecret
    ↑ return secret
TOTP Service
    ↓ speakeasy.totp.verify()
    ↑ return valid: true/false
Frontend
    ↓ if valid, navigate to vault with JWT
```

---

**Maintained by Thania Cisneros & Eduardo Jr Perez**
