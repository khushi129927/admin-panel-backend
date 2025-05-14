const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// 📅 Date Formatter
function formatDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD for DB
}

// 🚀 Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, dob, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (!/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      return res.status(400).json({ error: "Invalid date format. Use DD-MM-YYYY" });
    }

    const dobFormatted = formatDate(dob);

    const [existingUsers] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await db.execute("INSERT INTO users (id, name, dob, email, password) VALUES (?, ?, ?, ?, ?)",
      [id, name, dobFormatted, email, hashedPassword]);

    res.status(201).json({ success: true, message: "User registered" });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🚀 Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 📤 Get All Users
exports.getUsers = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM users");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Users Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
