const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../config/db");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!user.length) return res.status(404).json({ error: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await db.query("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?", [
      token,
      expiry,
      email,
    ]);

    const resetLink = `http://neuroeq-env-1.eba-ex2g2zu6.ap-south-1.elasticbeanstalk.com/api/password/reset-password?token=abc123xyz`;

    await transporter.sendMail({
      from: `"NeuroEQ Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `<p>Click the link below to reset your password. It will expire in 15 minutes:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).send("<h3>Missing token or password.</h3>");

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (!rows.length)
      return res.status(400).send("<h3>Invalid or expired token.</h3>");

    const user = rows[0];

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame)
      return res.send("<h3>Password cannot be the same as the previous one.</h3>");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE userId = ?",
      [hashedPassword, user.userId]
    );

    res.send("<h3>Password updated successfully.</h3>");
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).send("<h3>Something went wrong. Please try again later.</h3>");
  }
};
