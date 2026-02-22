jest.mock("../../models/user", () => {
  const User = jest.fn();
  User.findOne = jest.fn();
  User.findById = jest.fn();
  return User;
});

jest.mock("../../utils/validators", () => ({
  validateSignupReq: jest.fn(),
  validateLoginReq: jest.fn(),
  validateGoogleLogin: jest.fn(),
  validateUpdateProfileReq: jest.fn(),
  validateChangePasswordReq: jest.fn(),
}));

jest.mock("../../google-client", () => jest.fn());

const User = require("../../models/user");
const {
  signup,
  login,
  updatePreference,
  changePassword,
} = require("../authController");

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  return res;
};

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("signup creates a new user", async () => {
    User.findOne.mockResolvedValue(null);

    const save = jest.fn();
    const hashPassword = jest.fn();
    User.mockImplementationOnce(() => ({
      save,
      hashPassword,
    }));

    const req = {
      body: {
        fullName: "Test User",
        email: "test@example.com",
        password: "Strong@123",
        baseCurrency: "INR",
      },
    };
    const res = createRes();

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(hashPassword).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("login returns 400 for unknown user", async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: "test@example.com", password: "Strong@123" } };
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalled();
  });

  test("updatePreference updates currency and theme", async () => {
    const save = jest.fn();
    User.findOne.mockResolvedValue({
      _id: "u1",
      baseCurrency: "INR",
      theme: "light",
      save,
    });

    const req = {
      user: { _id: "u1" },
      body: { currency: "USD", theme: "dark" },
    };
    const res = createRes();

    await updatePreference(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("changePassword rejects invalid current password", async () => {
    User.findById.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    const req = {
      user: { _id: "u1" },
      body: { currentPassword: "Wrong@123", newPassword: "NewPass@1234" },
    };
    const res = createRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalled();
  });
});
