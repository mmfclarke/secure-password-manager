const request = require("supertest");
const { API_URL, uniqueEmail } = require("./helpers");

describe("Auth API happy path", () => {
  const email = uniqueEmail("auth");
  const password = "TestPass123!";

  test("POST /api/auth/register creates a new user", async () => {
    const res = await request(API_URL)
      .post("/api/auth/register")
      .send({ email, password });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User created");
    expect(res.body).toHaveProperty("userId");
  });

  test("POST /api/auth/login with valid credentials prompts MFA setup", async () => {
    const res = await request(API_URL)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.requireMFASetup).toBe(true);
    expect(res.body).toHaveProperty("userId");
  });
});
