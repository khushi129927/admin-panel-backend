// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your-secure-secret";

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Expect: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // attach user data to request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};
