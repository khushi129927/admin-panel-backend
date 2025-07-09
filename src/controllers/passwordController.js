const db = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ error: "Email is required" });

  try {
    // 🔍 Check if user with email exists
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (!users.length)
      return res.status(404).json({ error: "No user found with this email" });

    // 🔐 Generate token and expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 🛠️ Save token in DB
    await db.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [token, expiry, email]
    );

    // ✅ Return token in response (for backend-only verification flow)
    res.status(200).json({
      success: true,
      message: "Token generated. You can now reset your password using this token.",
      tokenFromEmail: token, // ❗ Show this ONLY if you're not using email verification
    });

  } catch (err) {
    console.error("❌ Forgot Password Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: "Token and new password required" });

  try {
    const [users] = await db.execute(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (!users.length)
      return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE userId = ?`,
      [hashedPassword, users[0].userId]
    );

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
