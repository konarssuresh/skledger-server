const express = require("express");
const {
  createDefaultCategories,
  createCategory,
} = require("../controllers/categoryController");

const internalAuth = require("../middlewares/internalAuth");
const validateUser = require("../middlewares/validateUser");

const categoryRouter = express.Router();

categoryRouter.post("/create-default", internalAuth, createDefaultCategories);

categoryRouter.post("/create", validateUser, createCategory);

module.exports = categoryRouter;
