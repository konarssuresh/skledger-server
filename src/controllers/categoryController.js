const Category = require("../models/category");
const defaultCategories = require("../config/defaultCategories");

const createDefaultCategories = async (req, res) => {
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

module.exports = {
  createDefaultCategories,
};
