const Category = require("../models/category");
const defaultCategories = require("../config/defaultCategories");
const { validateCreateCategoryReq } = require("../utils/validators");

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

module.exports = {
  createDefaultCategories,
  createCategory,
};
