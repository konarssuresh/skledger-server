const Category = require("../models/category");
const defaultCategories = require("../config/defaultCategories");
const {
  validateCreateCategoryReq,
  validateUpdateCategoryReq,
} = require("../utils/validators");

const createDefaultCategories = async (_, res) => {
  try {
    const existingCategories = await Category.find({ isDefault: true });
    if (existingCategories.length > 0) {
      return res
        .status(400)
        .json({ error: "Default categories already exist" });
    }

    await Category.insertMany(defaultCategories);
    res
      .status(201)
      .json({ message: "Default categories created successfully" });
  } catch (e) {
    console.error("Error creating default categories:", e);
    res.status(500).json({ error: "Failed to create default categories" });
  }
};

const createCategory = async (req, res) => {
  try {
    validateCreateCategoryReq(req);
    const { name, emoji, type } = req.body;

    const category = new Category({
      name,
      emoji,
      type,
      userId: req.user._id,
    });

    await category.save();
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    validateUpdateCategoryReq(req);
    const { id } = req.params;
    const { name, emoji, type } = req.body;

    const category = await Category.findOne({ _id: id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (name) category.name = name;
    if (emoji) category.emoji = emoji;
    if (type) category.type = type;

    await category.save();
    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId: req.user._id }],
    })
      .sort({ type: 1, name: 1 })
      .lean();

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.isDefault) {
      return res
        .status(400)
        .json({ error: "Default categories cannot be deleted" });
    }

    await category.deleteOne();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDefaultCategories,
  createCategory,
  updateCategory,
  getCategories,
  deleteCategory,
};
