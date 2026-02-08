const express = require("express");
const { signup, login } = require("../controllers/authController");

const validateUser = require("../middlewares/validateUser");

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);

module.exports = authRouter;
