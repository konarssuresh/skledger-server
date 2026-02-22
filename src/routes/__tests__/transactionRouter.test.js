const request = require("supertest");
const { createTestApp } = require("../../__tests__/testApp");
const {
  createUser,
  authCookieForUser,
  createCategory,
  createTransaction,
} = require("../../__tests__/helpers");

describe("transactionRouter APIs", () => {
  const app = createTestApp();

  test("POST /api/transactions/create creates transaction", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    const res = await request(app)
      .post("/api/transactions/create")
      .set("Cookie", authCookieForUser(user))
      .send({
        name: "Lunch",
        amount: 120,
        currency: "INR",
        categoryId: String(category._id),
        date: "2026-02-12",
        type: "expense",
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction.name).toBe("Lunch");
  });

  test("GET /api/transactions fetches all transactions", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    await createTransaction(user, category);

    const res = await request(app)
      .get("/api/transactions")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBe(1);
  });

  test("GET /api/transactions with date filter returns filtered data", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    await createTransaction(user, category, { date: new Date("2026-02-12T10:00:00.000Z") });
    await createTransaction(user, category, { date: new Date("2026-02-13T10:00:00.000Z") });

    const res = await request(app)
      .get("/api/transactions?date=2026-02-12")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBe(1);
  });

  test("GET /api/transactions/:id returns transaction by id", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    const tx = await createTransaction(user, category);

    const res = await request(app)
      .get(`/api/transactions/${tx._id}`)
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(res.body.transaction._id).toBe(String(tx._id));
  });

  test("PATCH /api/transactions/:id updates transaction", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    const tx = await createTransaction(user, category, { name: "Old" });

    const res = await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Cookie", authCookieForUser(user))
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.transaction.name).toBe("Updated");
  });

  test("DELETE /api/transactions/:id deletes transaction", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    const tx = await createTransaction(user, category);

    const res = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
  });

  test("GET /api/transactions/month-summary returns summary", async () => {
    const user = await createUser();
    const category = await createCategory(user);
    await createTransaction(user, category, {
      date: new Date("2026-02-12T10:00:00.000Z"),
      type: "income",
      amount: 2000,
    });
    await createTransaction(user, category, {
      date: new Date("2026-02-12T12:00:00.000Z"),
      type: "expense",
      amount: 500,
    });

    const res = await request(app)
      .get("/api/transactions/month-summary?year=2026&month=2")
      .set("Cookie", authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(res.body["2026-02-12"]).toBeDefined();
    expect(res.body["2026-02-12"].income).toBe(2000);
  });
});
