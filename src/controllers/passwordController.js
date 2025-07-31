const db = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ error: "Email is required" });

  try {
    // 1️⃣ Check if user exists
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (!users.length)
      return res.status(404).json({ error: "No user found with this email" });

    // 2️⃣ Generate reset token & expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 3️⃣ Save token in DB
    await db.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [token, expiry, email]
    );

    // 4️⃣ Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or use "hotmail", "outlook", etc., depending on your email provider
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const resetLink = `http://yourfrontend.com/reset-password?token=${token}`; // 👈 Replace with your actual frontend URL

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Reset link has been sent to your email.",
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
