const User = require("../models/user");
const getGoogleClient = require("../google-client");
const {
  validateSignupReq,
  validateLoginReq,
  validateGoogleLogin,
  validateUpdateProfileReq,
  validateChangePasswordReq,
} = require("../utils/validators");

const signup = async (req, res) => {
  try {
    validateSignupReq(req);
    const { fullName, email, password, baseCurrency } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email is already registered");
    }

    const user = new User({ fullName, email, password, baseCurrency });
    await user.hashPassword();
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const signout = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: isProd, // true in prod (HTTPS), false locally (HTTP)
    sameSite: isProd ? "none" : "lax", // cross-site cookies require none+secure
    path: "/",
  };

  if (isProd && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN; // e.g. ".example.com"
  }
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.json({ message: "Logout successful" });
};

const login = async (req, res) => {
  try {
    validateLoginReq(req);
    const { email, password } = req.body;
    const isProd = process.env.NODE_ENV === "production";
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = user.generateAuthToken();
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: isProd, // true in prod (HTTPS), false locally (HTTP)
      sameSite: isProd ? "none" : "lax", // cross-site cookies require none+secure
      path: "/",
    };

    if (isProd && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN; // e.g. ".example.com"
    }

    res.cookie("token", token, cookieOptions);
    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        baseCurrency: user.baseCurrency,
        theme: user.theme,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch current user" });
  }
};

const updatePreference = async (req, res) => {
  try {
    const user = req.user;
    const existingUser = await User.findOne({ _id: user._id });

    const { currency, theme } = req.body;
    if (currency) {
      existingUser.baseCurrency = currency;
    }
    if (theme) {
      existingUser.theme = theme;
    }
    await existingUser.save();

    res.status(200).json(existingUser);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const signinWithGoogle = async (req, res) => {
  try {
    validateGoogleLogin(req);
    const { credential } = req.body;
    const client = getGoogleClient();
    if (!client) {
      throw new Error("Google client is not configured");
    }
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.OAUTH_CLIENT || process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email } = payload;
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User does not exist");
    }

    const token = user.generateAuthToken();
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: isProd, // true in prod (HTTPS), false locally (HTTP)
      sameSite: isProd ? "none" : "lax", // cross-site cookies require none+secure
      path: "/",
    };

    if (isProd && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN; // e.g. ".example.com"
    }

    res.cookie("token", token, cookieOptions);

    res.send(payload);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    validateUpdateProfileReq(req);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { fullName, email } = req.body;
    let emailUpdated = false;

    if (fullName !== undefined) {
      user.fullName = String(fullName).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });
        if (existingUser) {
          throw new Error("Email is already registered");
        }
        user.email = normalizedEmail;
        user.verified = false;
        emailUpdated = true;
      }
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      emailVerificationRequired: emailUpdated,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        verified: user.verified,
        baseCurrency: user.baseCurrency,
        theme: user.theme,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    validateChangePasswordReq(req);
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const isSameAsCurrent = await user.comparePassword(newPassword);
    if (isSameAsCurrent) {
      throw new Error("New password must be different from current password");
    }

    user.password = newPassword;
    await user.hashPassword();
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
};

module.exports = {
  signup,
  signout,
  login,
  getCurrentUser,
  updatePreference,
  signinWithGoogle,
  updateProfile,
  changePassword,
};
