const express = require("express");
const {
  createDefaultCategories,
  createCategory,
  updateCategory,
  getCategories,
  deleteCategory,
} = require("../controllers/categoryController");

const internalAuth = require("../middlewares/internalAuth");
const validateUser = require("../middlewares/validateUser");

const categoryRouter = express.Router();

categoryRouter.post("/create-default", internalAuth, createDefaultCategories);

categoryRouter.post("/create", validateUser, createCategory);

categoryRouter.patch("/:id", validateUser, updateCategory);

categoryRouter.get("/", validateUser, getCategories);

categoryRouter.delete("/:id", validateUser, deleteCategory);

module.exports = categoryRouter;
