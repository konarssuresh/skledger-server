const express = require("express");
const {
  signup,
  signout,
  login,
  getCurrentUser,
  updatePreference,
} = require("../controllers/authController");
const validateUser = require("../middlewares/validateUser");

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/signout", signout);
authRouter.post("/login", login);
authRouter.get("/me", validateUser, getCurrentUser);
authRouter.post("/changePreferences", validateUser, updatePreference);

module.exports = authRouter;
