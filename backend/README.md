# Backend — Express API

Node.js + Express API for the Secure Password Manager. Handles user authentication, MFA integration, and encrypted credential vault operations.

**Responsibility:** Thania Cisneros

---

## Overview

The backend provides RESTful endpoints for:
- User registration and login with bcrypt password hashing
- JWT session management
- TOTP MFA coordination with the TOTP service
- Credential vault CRUD operations
- Input validation and security hardening (rate limiting, lockout, sanitization)

**Key Principle:** Server stores only ciphertext of credentials. Decryption happens client-side only. The master password hash is used for authentication, never for encryption.

---

## Architecture

### Routes

#### Authentication (`/api/auth`)
- `POST /register` — create account, bcrypt hash master password
- `POST /login` — verify password, issue JWT if correct, require MFA verification before acceptance

#### Credentials (`/api/credentials`)
- `GET /` — list user's credentials (requires JWT)
- `POST /` — create credential with encrypted data (requires JWT)
- `PUT /:id` — update credential (requires JWT)
- `DELETE /:id` — delete credential (requires JWT)

#### Internal (`/api/internal`)
- `GET /users/:userId/totp` — retrieve TOTP secret (TOTP service only, requires x-internal-secret)
- `POST /users/:userId/complete-mfa` — mark MFA as complete after verification (TOTP service only)

### Models

#### User
```javascript
{
  email: String (unique),
  masterPasswordHash: String (bcrypt, 12 rounds),
  totpSecret: String (base32, only if MFA enabled),
  mfaEnabled: Boolean,
  lockout: {
    isLocked: Boolean,
    unlocksAt: Date (15 minutes from last failed attempt)
  }
}
```

#### Credentials
```javascript
{
  userId: ObjectId (ref to User),
  title: String,
  username: String,
  website: String,
  category: String (personal/work/finance/social/other),
  encryptedData: {
    ciphertext: String,
    iv: String,
    salt: String
  }
}
```

### Middleware

- **authMiddleware.js** — validates JWT, attaches `req.user` to protected routes
- **internalAuthMiddleware.js** — validates `x-internal-secret` header for TOTP service calls

### Security

- **Rate Limiting** — login endpoint: max 5 attempts per IP per 15-minute window
- **Account Lockout** — 15-minute lockout after 5 failed login attempts
- **Input Validation** — strong-password check on register, TOTP secret format validation
- **Injection Prevention** — input validation via authMiddleware (removes/rejects malicious patterns)
- **HTTPS/TLS** — required in production
- **CORS** — restricted to known frontend origins
- **CSP/HSTS Headers** — via helmet middleware
- **No Logging** — plaintext passwords, TOTP secrets never logged

---

## Setup

### Prerequisites
- Node.js v20+
- npm/yarn
- MongoDB (local) or AWS DocumentDB (production)

### Installation
```bash
cd backend
npm install
cp .env.example .env
```

### Environment Variables
```env
PORT=5000
JWT_SECRET=<random-string-for-signing-tokens>
MONGO_URI=mongodb://localhost:27017/password-manager
TOTP_INTERNAL_SECRET=<shared-secret-with-totp-service>
```

**For production DocumentDB:**
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/password-manager?tls=true&tlsCAFile=/path/to/ca.pem
MONGO_TLS_CA_FILE=/path/to/ca.pem
```

### Development
```bash
npm run dev
# Runs on http://localhost:5000
```

### Build / Production
```bash
npm run start
# Runs on specified PORT
```

---

## Key Files

```
├── middleware/
│   ├── authMiddleware.js           # JWT validation
│   └── internalAuthMiddleware.js   # x-internal-secret validation
├── models/
│   ├── User.js                     # User schema + methods
│   └── Credentials.js              # Credential schema
├── routes/
│   ├── authRoutes.js               # /auth/register, /auth/login
│   ├── credentialRoutes.js         # /credentials CRUD
│   └── internalRoutes.js           # /internal/* for TOTP service
├── server.js                       # Express setup, routes, middleware
└── package.json
```

---

## API Endpoints

### Authentication

#### POST /api/auth/register
Request:
```json
{
  "email": "user@example.com",
  "password": "MasterPassword123!"
}
```

Response (201):
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "message": "User created successfully"
}
```

Validation:
- Password: 12+ chars, uppercase, lowercase, number, special character
- Email: valid format, unique

---

#### POST /api/auth/login
Request:
```json
{
  "email": "user@example.com",
  "password": "MasterPassword123!"
}
```

Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requiresMFA": true,
  "userId": "507f1f77bcf86cd799439011"
}
```

If `requiresMFA` is true, client calls `/totp/verify` next.

---

### Credentials (Protected Routes)

All require `Authorization: Bearer <token>` header.

#### GET /api/credentials
Response (200):
```json
[
  {
    "_id": "...",
    "title": "GitHub",
    "username": "user@example.com",
    "website": "github.com",
    "category": "work",
    "encryptedData": {
      "ciphertext": "...",
      "iv": "...",
      "salt": "..."
    }
  }
]
```

---

#### POST /api/credentials
Request:
```json
{
  "title": "GitHub",
  "username": "user@example.com",
  "website": "github.com",
  "category": "work",
  "encryptedData": {
    "ciphertext": "...",
    "iv": "...",
    "salt": "..."
  }
}
```

Response (201):
```json
{
  "_id": "...",
  "title": "GitHub",
  ...
}
```

---

#### PUT /api/credentials/:id
Same structure as POST. Updates the credential.

Response (200): Updated credential object

---

#### DELETE /api/credentials/:id
Response (200):
```json
{
  "message": "Credential deleted"
}
```

---

### Internal Routes (TOTP Service Only)

#### GET /api/internal/users/:userId/totp
Header: `x-internal-secret: <shared-secret>`

Response (200):
```json
{
  "totpSecret": "JBSWY3DPEBLW64TMMQ======"
}
```

---

#### POST /api/internal/users/:userId/complete-mfa
Header: `x-internal-secret: <shared-secret>`

Body:
```json
{
  "mfaEnabled": true
}
```

Response (200):
```json
{
  "message": "MFA enabled for user"
}
```

---

## Common Tasks

### Adding a New Endpoint
1. Create route in `routes/` directory
2. Import in `server.js` and register: `app.use('/api/route', require('./routes/routeFile'))`
3. Add JWT or internal auth middleware if protected
4. Test with curl or Postman

### Updating Mongoose Schemas
1. Modify schema in `models/`
2. Consider migration strategy (old documents must still work)
3. Document changes in `documents/schema-handoff.md`

### Debugging
- Check `NODE_ENV` and `PORT`
- Verify `MONGO_URI` connection
- Check JWT_SECRET is set (same across all instances)
- Verify TOTP_INTERNAL_SECRET matches TOTP service env var

---

## Error Handling

Endpoint responses follow consistent structure:

**Success (2xx):**
```json
{
  "data": {...} or [...],
  "message": "Operation successful"
}
```

**Client Error (4xx):**
```json
{
  "error": "Description of what went wrong"
}
```

**Server Error (5xx):**
```json
{
  "error": "Internal server error"
}
```

---

## Testing Checklist

**Before committing:**
- [ ] All endpoints return expected status codes
- [ ] JWT validation works (protected routes reject invalid tokens)
- [ ] TOTP internal auth works (routes reject invalid x-internal-secret)
- [ ] Password hashing works (bcrypt)
- [ ] Rate limiting blocks after 5 failed login attempts
- [ ] Account lockout expires after 15 minutes
- [ ] Input validation rejects malformed data
- [ ] No plaintext passwords logged

---

## Performance Considerations

- **bcrypt salt rounds:** 12 (default) — tuned for ~100ms hash time
- **JWT expiry:** 24 hours — balance between security and UX
- **DocumentDB indexes:** created on `userId`, `email` for query performance
- **Query optimization:** use projection to exclude unnecessary fields

---

## Dependencies

Key packages:
- **express** (5.x) — web framework
- **mongoose** — MongoDB ODM
- **bcrypt** — password hashing
- **jsonwebtoken** — JWT signing/verification
- **helmet** — HTTP security headers
- **cors** — cross-origin resource sharing

See `package.json` for full list and versions.

---

**Maintained by Thania Cisneros**
