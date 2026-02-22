const internalAuth = require("../internalAuth");

const runMiddleware = async (req) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.payload = body;
        resolve({ req, res: this, nextCalled: false });
      },
    };

    internalAuth(req, res, () => {
      resolve({ req, res, nextCalled: true });
    });
  });

describe("internalAuth middleware", () => {
  beforeEach(() => {
    process.env.INTERNAL_KEY = "test-internal-key";
  });

  test("returns 403 when key is missing", async () => {
    const result = await runMiddleware({ headers: {} });
    expect(result.nextCalled).toBe(false);
    expect(result.res.statusCode).toBe(403);
  });

  test("returns 403 when key is invalid", async () => {
    const result = await runMiddleware({
      headers: { "x-internal-key": "wrong-key" },
    });
    expect(result.nextCalled).toBe(false);
    expect(result.res.statusCode).toBe(403);
  });

  test("calls next for valid key", async () => {
    const result = await runMiddleware({
      headers: { "x-internal-key": "test-internal-key" },
    });
    expect(result.nextCalled).toBe(true);
  });
});
