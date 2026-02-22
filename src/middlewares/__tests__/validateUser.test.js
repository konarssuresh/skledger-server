const validateUser = require("../validateUser");
const { createUser } = require("../../__tests__/helpers");

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

    validateUser(req, res, () => {
      resolve({ req, res, nextCalled: true });
    });
  });

describe("validateUser middleware", () => {
  test("returns 401 when token cookie is missing", async () => {
    const result = await runMiddleware({ cookies: {} });
    expect(result.nextCalled).toBe(false);
    expect(result.res.statusCode).toBe(401);
  });

  test("returns 401 when token is invalid", async () => {
    const result = await runMiddleware({ cookies: { token: "bad-token" } });
    expect(result.nextCalled).toBe(false);
    expect(result.res.statusCode).toBe(401);
  });

  test("calls next and sets req.user when token is valid", async () => {
    const user = await createUser();
    const result = await runMiddleware({
      cookies: { token: user.generateAuthToken() },
    });
    expect(result.nextCalled).toBe(true);
    expect(String(result.req.user._id)).toBe(String(user._id));
  });
});
