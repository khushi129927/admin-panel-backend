const db = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ error: "Email is required" });

  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (!users.length)
      return res.status(404).json({ error: "No user found with this email" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [token, expiry, email]
    );

    const resetLink = `https://yourfrontend.com/reset-password?token=${token}`;

    // Send email (optional - production only)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Reset your NeuroEQ password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
    });

    // ✅ Include token for testing/debugging
    res.status(200).json({
      success: true,
      message: "Reset link sent to email.",
      tokenFromEmail: token // remove this in production
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
