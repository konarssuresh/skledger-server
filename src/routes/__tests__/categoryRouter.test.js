const request = require("supertest");
const { createTestApp } = require("../../__tests__/testApp");
const { createUser, authCookieForUser, createCategory } = require("../../__tests__/helpers");

describe("categoryRouter APIs", () => {
  const app = createTestApp();

  test("POST /api/categories/create-default requires internal key", async () => {
    const failRes = await request(app).post("/api/categories/create-default");
    expect(failRes.status).toBe(403);

    const okRes = await request(app)
      .post("/api/categories/create-default")
      .set("x-internal-key", process.env.INTERNAL_KEY);
    expect(okRes.status).toBe(201);
  });

  test("POST /api/categories/create creates category", async () => {
    const user = await createUser();
    const res = await request(app)
      .post("/api/categories/create")
      .set("Cookie", authCookieForUser(user))
      .send({ name: "Transport", type: "expense", emoji: "🚗" });

    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe("Transport");
  });

  test("GET /api/categories returns categories", async () => {
    const user = await createUser();
    await createCategory(user, { name: "Food" });
    const res = await request(app)
      .get("/api/categories")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  test("PATCH /api/categories/:id updates category", async () => {
    const user = await createUser();
    const category = await createCategory(user, { name: "Old Name" });
    const res = await request(app)
      .patch(`/api/categories/${category._id}`)
      .set("Cookie", authCookieForUser(user))
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe("New Name");
  });

  test("DELETE /api/categories/:id deletes category", async () => {
    const user = await createUser();
    const category = await createCategory(user, { name: "Temp", isDefault: false });
    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
  });
});
