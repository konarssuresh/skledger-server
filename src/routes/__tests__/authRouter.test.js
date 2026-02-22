const request = require("supertest");
const { createTestApp } = require("../../__tests__/testApp");
const { createUser, authCookieForUser } = require("../../__tests__/helpers");

describe("authRouter APIs", () => {
  const app = createTestApp();

  test("POST /api/auth/signup registers user", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Signup User",
      email: "signup@test.com",
      password: "Strong@123",
      baseCurrency: "INR",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered successfully/i);
  });

  test("POST /api/auth/login authenticates and sets cookie", async () => {
    await createUser({ email: "login@test.com", password: "Pass@1234" });
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "Pass@1234",
    });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("POST /api/auth/login/google rejects invalid payload", async () => {
    const res = await request(app).post("/api/auth/login/google").send({});
    expect(res.status).toBe(400);
  });

  test("GET /api/auth/me returns unauthorized without cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me returns current user with cookie", async () => {
    const user = await createUser({ email: "me@test.com" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("me@test.com");
  });

  test("POST /api/auth/changePreferences updates theme/currency", async () => {
    const user = await createUser({ email: "pref@test.com" });
    const res = await request(app)
      .post("/api/auth/changePreferences")
      .set("Cookie", authCookieForUser(user))
      .send({ currency: "USD", theme: "dark" });

    expect(res.status).toBe(200);
    expect(res.body.baseCurrency).toBe("USD");
    expect(res.body.theme).toBe("dark");
  });

  test("PATCH /api/auth/profile updates fullName", async () => {
    const user = await createUser({ email: "profile@test.com" });
    const res = await request(app)
      .patch("/api/auth/profile")
      .set("Cookie", authCookieForUser(user))
      .send({ fullName: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe("Updated Name");
  });

  test("POST /api/auth/change-password changes password", async () => {
    const user = await createUser({ email: "password@test.com", password: "Pass@1234" });
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", authCookieForUser(user))
      .send({ currentPassword: "Pass@1234", newPassword: "NewPass@1234" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed successfully/i);
  });

  test("POST /api/auth/signout clears token cookie", async () => {
    const res = await request(app).post("/api/auth/signout");
    expect(res.status).toBe(200);
  });
});
