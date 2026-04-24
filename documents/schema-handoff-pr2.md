# Schema Update Handoff — PR #2

**From:** Matthew  
**To:** Thania  
**Date:** 2026-04-24  
**Branch:** `feat/matthew-schema_updates`

This doc covers the schema changes I made to `User.js` and `Credentials.js`, why I made them, the encryption contract your vault routes need to follow, and a note on the TOTP folder situation.

---

## What Changed and Why

### `backend/models/User.js`

| Field | Change | Reason |
|---|---|---|
| `password` | Renamed → `masterPasswordHash` | More accurate name — this is bcrypt output, not a raw password. Aligns with how we talk about it in the project. |
| `totpSecret` | Added (String, default null) | Speakeasy stores the base32 TOTP secret here on enrollment. Null until the user completes MFA setup. |
| `mfaEnabled` | Added (Boolean, default false) | Login flow checks this to decide whether TOTP verification is required. Flips to true when enrollment is complete. |
| `failedLoginAttempts` | Added (Number, default 0) | Brute force protection — increment on failed login. |
| `lockoutUntil` | Added (Date, default null) | Set to `now + 15 minutes` when `failedLoginAttempts` hits 5. Login route checks this first. |
| `email` | Added `lowercase: true, trim: true` | Prevents duplicate accounts from casing differences (e.g. "User@gmail.com" vs "user@gmail.com"). |

**`authRoutes.js` updated — already fixed in this branch:**  
The existing login and register routes referenced the old `password` field. Matthew updated both references to `masterPasswordHash` so the routes stay in sync with the schema. No action needed on your end for this.

---

### `backend/models/Credentials.js`

The big change here is that `username` and `password` are no longer stored as separate plaintext fields. They are now bundled together and AES-256 encrypted client-side before the request ever reaches the backend. The schema now holds the encrypted output instead.

**Removed:**
- `username` (String)
- `password` (String, required)

**Added:**
- `encryptedData` subdocument (required), containing:
  - `ciphertext` (String, required) — the AES-256 encrypted payload
  - `iv` (String, required) — initialization vector used for this encryption
  - `salt` (String, required) — salt used to derive the key from the master password

**Why:** This enforces the core security guarantee — the server never sees plaintext credentials. My `crypto.js` on the frontend will handle all encryption before sending and all decryption after receiving. Your routes treat `encryptedData` as an opaque blob and never need to inspect what's inside it.

**Also changed:** Model export name changed from `"Credentials"` (plural) to `"Credential"` (singular) — standard Mongoose convention.

---

## Encryption Contract — What `ciphertext` Contains

The plaintext that gets encrypted is a JSON object with exactly these two fields:

```json
{
  "username": "john@example.com",
  "password": "s3cr3tP@ssw0rd"
}
```

This gets `JSON.stringify`'d, encrypted with AES-256 using the user's master password as the key source, and the output (`ciphertext`, `iv`, `salt`) is what your routes receive and store.

**What a full POST /api/credentials request body looks like:**

```json
{
  "title": "Gmail",
  "website": "gmail.com",
  "category": "personal",
  "encryptedData": {
    "ciphertext": "U2FsdGVkX1...",
    "iv": "a1b2c3d4...",
    "salt": "e5f6a7b8..."
  }
}
```

`title`, `website`, and `category` are plaintext — they're metadata used for display and filtering. Only `username` and `password` are encrypted.

**Your routes just pass `encryptedData` through — no inspection, no transformation needed.**

---

## What This Means for Your PR #2 Work

### Vault CRUD routes (`/api/credentials`)

- `userId` gets set server-side from the JWT — never trust it from the request body
- Accept `encryptedData` as-is and store it
- On `GET`, return the full document including `encryptedData` — Matthew's frontend handles decryption
- Validate that `encryptedData`, `encryptedData.ciphertext`, `encryptedData.iv`, and `encryptedData.salt` are all present on POST/PUT

### MFA / TOTP integration

The `User` schema now has `totpSecret` and `mfaEnabled` ready for your speakeasy work. The enrollment flow should:

1. Generate a speakeasy secret → save to `user.totpSecret`
2. Return the QR provisioning URI to the frontend
3. On the user's first successful TOTP verification → set `user.mfaEnabled = true`
4. On every login where `user.mfaEnabled === true` → require a valid TOTP before issuing the JWT

---

## TOTP Folder — Where the Code Lives

If you have speakeasy logic currently sitting in `backend/` (routes or otherwise), it needs to move to `totp/`. The architecture keeps these as separate services on separate EC2 instances:

- **`backend/`** — Express API: auth, vault CRUD, JWT. Reads/writes `totpSecret` and `mfaEnabled` on the User document.
- **`totp/`** — Speakeasy service: secret generation, QR code provisioning, TOTP verification endpoint. The backend calls this service; it does not implement TOTP itself.

The schema fields (`totpSecret`, `mfaEnabled`) live in `backend/models/User.js` because they're database concerns. But any speakeasy imports, secret generation, and TOTP verification logic belong in `totp/`.
