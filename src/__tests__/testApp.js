const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("../routes/authRouter");
const categoryRouter = require("../routes/categoryRouter");
const transactionRouter = require("../routes/transactionRouter");
const analyticsRouter = require("../routes/analyticsRouter");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/transactions", transactionRouter);
  app.use("/api/analytics", analyticsRouter);
  return app;
};

module.exports = { createTestApp };
