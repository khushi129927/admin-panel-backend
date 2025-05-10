const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

function formatDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD for DB
  }

exports.registerUser = async (req, res) => {
  const { name, dob, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (!/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
    return res.status(400).json({ error: "Invalid date format. Use DD-MM-YYYY" });
  }

  // ✅ Convert DOB to DB Format (YYYY-MM-DD)
  const dobFormatted = formatDate(dob);

  const checkEmailSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailSql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const sql = "INSERT INTO users (id, name, dob, email, password) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [id, name, dobFormatted, email, hashedPassword], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, message: "User registered" });
    });
  });
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ success: true, token });
  });
};

exports.getUsers = (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};
