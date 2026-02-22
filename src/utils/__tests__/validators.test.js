const {
  validateSignupReq,
  validateLoginReq,
  validateUpdateProfileReq,
  validateChangePasswordReq,
  validateCreateCategoryReq,
  validateUpdateCategoryReq,
  validateCreateTransactionReq,
  validateUpdateTransactionReq,
  validateGoogleLogin,
} = require("../validators");

describe("validators utils", () => {
  test("validateSignupReq accepts a valid request", () => {
    expect(
      validateSignupReq({
        body: {
          fullName: "Test User",
          email: "test@example.com",
          password: "Strong@123",
          baseCurrency: "INR",
        },
      }),
    ).toBe(true);
  });

  test("validateSignupReq rejects invalid fields", () => {
    expect(() =>
      validateSignupReq({
        body: {
          fullName: "Test User",
          email: "test@example.com",
          password: "Strong@123",
          unknown: true,
        },
      }),
    ).toThrow(/Invalid fields/i);
  });

  test("validateLoginReq rejects invalid email", () => {
    expect(() =>
      validateLoginReq({ body: { email: "bad", password: "abc" } }),
    ).toThrow(/valid email/i);
  });

  test("validateUpdateProfileReq requires at least one field", () => {
    expect(() => validateUpdateProfileReq({ body: {} })).toThrow(
      /At least one field/i,
    );
  });

  test("validateChangePasswordReq validates strong new password", () => {
    expect(() =>
      validateChangePasswordReq({
        body: { currentPassword: "Old@1234", newPassword: "weak" },
      }),
    ).toThrow(/newPassword/i);
  });

  test("validateCreateCategoryReq validates allowed type", () => {
    expect(() =>
      validateCreateCategoryReq({ body: { name: "Fuel", type: "other" } }),
    ).toThrow(/Category type/i);
  });

  test("validateUpdateCategoryReq accepts partial update", () => {
    expect(
      validateUpdateCategoryReq({ body: { name: "Updated", emoji: "🛒" } }),
    ).toBe(true);
  });

  test("validateCreateTransactionReq validates required payload", () => {
    expect(
      validateCreateTransactionReq({
        body: {
          name: "Milk",
          amount: 56,
          currency: "INR",
          categoryId: "507f191e810c19729de860ea",
          date: "2026-02-12T00:00:00.000Z",
          type: "expense",
        },
      }),
    ).toBe(true);
  });

  test("validateUpdateTransactionReq rejects negative amount", () => {
    expect(() =>
      validateUpdateTransactionReq({
        body: {
          amount: -5,
        },
      }),
    ).toThrow(/Amount must be a positive number/i);
  });

  test("validateGoogleLogin requires credential", () => {
    expect(() => validateGoogleLogin({ body: {} })).toThrow(/credential is required/i);
  });
});
