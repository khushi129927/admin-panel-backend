const jwt = require("jsonwebtoken");

// ✅ Verify Token Middleware
exports.verifyToken = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ success: true, user: decoded });
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid or expired token" });
  }
};
