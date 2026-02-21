const express = require("express");
const validateUser = require("../middlewares/validateUser");
const { getDashboardAnalytics } = require("../controllers/analyticsController");

const analyticsRouter = express.Router();

analyticsRouter.get("/dashboard", validateUser, getDashboardAnalytics);

module.exports = analyticsRouter;
