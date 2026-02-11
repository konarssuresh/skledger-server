const express = require("express");
const { signup, login, getCurrentUser } = require("../controllers/authController");
const validateUser = require("../middlewares/validateUser");

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.get("/me", validateUser, getCurrentUser);

module.exports = authRouter;
