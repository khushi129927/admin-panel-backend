const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const nodemailer = require("nodemailer");

// Set up Hostinger SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "ganeshbirale87@gmail.com", // replace with your Hostinger email
    pass: "*Neuroeq#"        // use the mailbox password
  }
});

// Function to send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
  const optsId = uuidv4();

  try {
    // Save OTP to database
    await db.query(
      `INSERT INTO otps (optsId, email, code, expires_at) VALUES (?, ?, ?, ?)`,
      [optsId, email, otpCode, expiresAt]
    );

    // Send OTP email
    await transporter.sendMail({
      from: '"Your App Name" <your-email@yourdomain.com>',
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otpCode}. It will expire in 5 minutes.`
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Function to verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM otps WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const otpRecord = rows[0];

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Optionally: delete OTP after successful verification
    await db.query(`DELETE FROM otps WHERE optsId = ?`, [otpRecord.optsId]);

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("❌ OTP verification failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
