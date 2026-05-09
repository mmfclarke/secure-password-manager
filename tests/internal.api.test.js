const request = require("supertest");
const {
  API_URL,
  INTERNAL_SECRET,
  uniqueEmail,
  registerUser,
} = require("./helpers");

const TEST_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

describe("Internal API happy path", () => {
  let userId;

  beforeAll(async () => {
    const email = uniqueEmail("internal");
    const password = "TestPass123!";
    userId = await registerUser(email, password);
  });

  test("PUT /api/internal/users/:userId/totp saves the TOTP secret", async () => {
    const res = await request(API_URL)
      .put(`/api/internal/users/${userId}/totp`)
      .set("x-internal-secret", INTERNAL_SECRET)
      .send({ totpSecret: TEST_TOTP_SECRET });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("TOTP secret saved");
  });

  test("GET /api/internal/users/:userId/totp-secret returns the saved secret", async () => {
    const res = await request(API_URL)
      .get(`/api/internal/users/${userId}/totp-secret`)
      .set("x-internal-secret", INTERNAL_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.totpSecret).toBe(TEST_TOTP_SECRET);
  });

  test("POST /api/internal/users/:userId/complete-mfa returns a JWT", async () => {
    const res = await request(API_URL)
      .post(`/api/internal/users/${userId}/complete-mfa`)
      .set("x-internal-secret", INTERNAL_SECRET);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });
});
