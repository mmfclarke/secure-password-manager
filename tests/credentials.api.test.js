const request = require("supertest");
const { API_URL, uniqueEmail, registerUser, getJwt } = require("./helpers");

describe("Credentials API happy path", () => {
  let jwtToken;
  let credentialId;

  beforeAll(async () => {
    const email = uniqueEmail("creds");
    const password = "TestPass123!";
    const userId = await registerUser(email, password);
    jwtToken = await getJwt(userId);
  });

  test("POST /api/credentials creates a credential", async () => {
    const res = await request(API_URL)
      .post("/api/credentials")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({
        title: "Test Site",
        website: "https://example.com",
        category: "personal",
        encryptedData: {
          ciphertext: "fakeCiphertextBase64==",
          iv: "fakeIvBase64==",
          salt: "fakeSaltBase64==",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.title).toBe("Test Site");
    expect(res.body.category).toBe("personal");

    credentialId = res.body._id;
  });

  test("GET /api/credentials returns a list including the new credential", async () => {
    const res = await request(API_URL)
      .get("/api/credentials")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c) => c._id === credentialId)).toBe(true);
  });

  test("GET /api/credentials/:id returns the credential", async () => {
    const res = await request(API_URL)
      .get(`/api/credentials/${credentialId}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(credentialId);
    expect(res.body.title).toBe("Test Site");
  });

  test("PUT /api/credentials/:id updates the credential", async () => {
    const res = await request(API_URL)
      .put(`/api/credentials/${credentialId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({ title: "Updated Test Site" });

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(credentialId);
    expect(res.body.title).toBe("Updated Test Site");
  });

  test("DELETE /api/credentials/:id removes the credential", async () => {
    const res = await request(API_URL)
      .delete(`/api/credentials/${credentialId}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Deleted successfully");
  });
});
