const express = require("express");
const {
  createDefaultCategories,
} = require("../controllers/categoryController");

const internalAuth = require("../middlewares/internalAuth");

const categoryRouter = express.Router();

categoryRouter.post("/create-default", internalAuth, createDefaultCategories);

module.exports = categoryRouter;
