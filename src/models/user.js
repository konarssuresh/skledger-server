const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxLength: [50, "Full name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    baseCurrency: {
      type: String,
      default: "INR",
      enum: ["USD", "EUR", "GBP", "INR", "JPY", "CNY"], // Add more currencies as needed
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.hashPassword = async function () {
  let user = this;
  let passwordHash = await bcrypt.hash(user.password, 10);
  user.password = passwordHash;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  let user = this;
  return await bcrypt.compare(candidatePassword, user.password);
};

userSchema.methods.generateAuthToken = function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
