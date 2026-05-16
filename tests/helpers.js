const request = require("supertest");
const speakeasy = require("speakeasy");

const API_URL = process.env.API_BASE_URL || "http://localhost:3001";
const TOTP_URL = process.env.TOTP_BASE_URL || "http://localhost:4000";
const INTERNAL_SECRET = process.env.TOTP_INTERNAL_SECRET;

if (!INTERNAL_SECRET) {
  throw new Error(
    "TOTP_INTERNAL_SECRET env var is required to run these tests"
  );
}

function uniqueEmail(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}@example.com`;
}

async function registerUser(email, password) {
  const res = await request(API_URL)
    .post("/api/auth/register")
    .send({ email, password });

  if (res.status !== 201) {
    throw new Error(
      `registerUser failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }
  return res.body.userId;
}

async function getJwt(userId) {
  const res = await request(API_URL)
    .post(`/api/internal/users/${userId}/complete-mfa`)
    .set("x-internal-secret", INTERNAL_SECRET);

  if (res.status !== 200) {
    throw new Error(
      `getJwt failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }
  return res.body.token;
}

async function getTotpSecret(userId) {
  const res = await request(API_URL)
    .get(`/api/internal/users/${userId}/totp-secret`)
    .set("x-internal-secret", INTERNAL_SECRET);

  if (res.status !== 200) {
    throw new Error(
      `getTotpSecret failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }
  return res.body.totpSecret;
}

function generateTotpCode(secret) {
  return speakeasy.totp({
    secret,
    encoding: "base32",
  });
}

module.exports = {
  API_URL,
  TOTP_URL,
  INTERNAL_SECRET,
  uniqueEmail,
  registerUser,
  getJwt,
  getTotpSecret,
  generateTotpCode,
};
