const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("../utils/tokenBlacklist");

const SECRET_KEY = process.env.JWT_SECRET || "your-secure-secret";

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  if (isBlacklisted(token)) {
    return res.status(401).json({ error: "Token has been invalidated. Please log in again." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};
