const jwt = require("jsonwebtoken");
const User = require("../models/user");

const validateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // Attach user to request object for downstream use
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = validateUser;
