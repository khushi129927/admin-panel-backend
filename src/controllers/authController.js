const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendOTP } = require("../utils/mailer");
const { addToBlacklist } = require("../utils/tokenBlacklist");

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

exports.sendOtpToEmail = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await db.execute(
      `INSERT INTO otps (optsId, email, code, expires_at)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), email, otp, expiresAt]
    );

    await sendOTP(email, otp);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM otps WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const otpEntry = rows[0];
    if (new Date(otpEntry.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("❌ OTP Verify Error:", err.message);
    res.status(500).json({ error: "OTP verification failed" });
  }
};

exports.logoutUser = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ error: "Token required for logout." });
  }

  addToBlacklist(token);
  res.json({ success: true, message: "User logged out successfully. Token invalidated." });
};