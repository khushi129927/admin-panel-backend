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

    // 2️⃣ Generate token & expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 3️⃣ Save token and expiry in DB
    await db.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [token, expiry, email]
    );

    // 4️⃣ Configure transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",       
      port: 465,                         
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 5️⃣ Create reset link pointing to your backend form
    const resetLink = `http://neuroeq-env-1.eba-ex2g2zu6.ap-south-1.elasticbeanstalk.com/api/password/reset-password?token=${token}`;

    // 6️⃣ Email content
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Reset Your NeuroEQ Password",
      html: `
        <h2>NeuroEQ Password Reset</h2>
        <p>Click the link below to reset your password. This link will expire in 1 hour:</p>
        <a href="${resetLink}">${resetLink}</a>
        <br><br>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
    };

    // 7️⃣ Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Reset password link sent to your email.",
    });

  } catch (err) {
    console.error("❌ Forgot Password Error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};





exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: "Token and new password required" });

  try {
    const [users] = await db.execute(
      `SELECT * FROM users 
       WHERE reset_token = ? 
       AND reset_token_expiry > NOW()`,
      [token]
    );

    if (!users.length)
      return res.status(400).json({ error: "Invalid or expired token" });

    const user = users[0];

    // 🔄 Check if password was updated recently (within 5 minutes)
    if (user.last_password_updated) {
      const lastUpdate = new Date(user.last_password_updated);
      const now = new Date();
      const diffMinutes = (now - lastUpdate) / (1000 * 60);
      if (diffMinutes <= 5) {
        return res.status(200).json({
          success: true,
          message: "Password already updated recently",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL, last_password_updated = NOW() 
       WHERE userId = ?`,
      [hashedPassword, user.userId]
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
