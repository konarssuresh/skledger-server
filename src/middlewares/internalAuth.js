const internalAuth = (req, res, next) => {
  const key = req.headers["x-internal-key"];
  console.log("Internal key received:", key); // Debug log to check the key value
  if (!key || key !== process.env.INTERNAL_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid internal key" });
  }
  next();
};

module.exports = internalAuth;
