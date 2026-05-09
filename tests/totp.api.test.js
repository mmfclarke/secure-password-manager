const request = require("supertest");
const {
  TOTP_URL,
  uniqueEmail,
  registerUser,
  getTotpSecret,
  generateTotpCode,
} = require("./helpers");

describe("TOTP service API happy path", () => {
  let userId;

  beforeAll(async () => {
    const email = uniqueEmail("totp");
    const password = "TestPass123!";
    userId = await registerUser(email, password);
  });

  test("POST /totp/setup returns a QR code data URL", async () => {
    const res = await request(TOTP_URL)
      .post("/totp/setup")
      .send({ userId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("qrCode");
    expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);
  });

  test("POST /totp/verify with a valid generated code returns a JWT", async () => {
    const secret = await getTotpSecret(userId);
    const code = generateTotpCode(secret);

    const res = await request(TOTP_URL)
      .post("/totp/verify")
      .send({ userId, token: code });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });
});
