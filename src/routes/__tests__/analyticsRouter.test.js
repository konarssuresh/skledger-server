const request = require("supertest");
const { createTestApp } = require("../../__tests__/testApp");
const {
  createUser,
  authCookieForUser,
  createCategory,
  createTransaction,
} = require("../../__tests__/helpers");

describe("analyticsRouter APIs", () => {
  const app = createTestApp();

  test("GET /api/analytics/dashboard returns dashboard payload", async () => {
    const user = await createUser();
    const category = await createCategory(user, { name: "Food", type: "expense" });
    await createTransaction(user, category, {
      date: new Date("2026-02-12T10:00:00.000Z"),
      type: "expense",
      amount: 500,
    });

    const res = await request(app)
      .get("/api/analytics/dashboard?periodType=monthly&date=2026-02-01")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(Array.isArray(res.body.categorySummary)).toBe(true);
    expect(Array.isArray(res.body.trendSummary)).toBe(true);
    expect(res.body.insights).toBeDefined();
    expect(Array.isArray(res.body.recentTransactions)).toBe(true);
  });

  test("GET /api/analytics/dashboard validates periodType", async () => {
    const user = await createUser();
    const res = await request(app)
      .get("/api/analytics/dashboard?periodType=invalid&date=2026-02-01")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(400);
  });
});
