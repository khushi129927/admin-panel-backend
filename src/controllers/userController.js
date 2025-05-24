const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// 📅 Date Formatter
function formatDate(dateString) {
  const [day, month, year] = dateString.split("-");
  return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD for DB
}

// 🔐 Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, dob, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) return res.status(400).json({ error: "Passwords do not match" });
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dob)) return res.status(400).json({ error: "Invalid DOB format (DD-MM-YYYY)" });

    const dobFormatted = formatDate(dob);
    const [exists] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (exists.length) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.execute("INSERT INTO users (id, name, dob, email, password) VALUES (?, ?, ?, ?, ?)",
      [id, name, dobFormatted, email, hashed]);

    res.status(201).json({ success: true, message: "User registered" });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔐 Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(401).json({ error: "Invalid credentials" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🧑‍🎓 Create Parent User
exports.createParent = async (req, res) => {
  const { name, dob, email, password, gender, education, profession, hobbies, favourite_food } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.execute("INSERT INTO users (id, name, dob, email, password) VALUES (?, ?, ?, ?, ?)",
      [id, name, dob, email, hashed]);
    await db.execute("INSERT INTO parents (id, name, gender, education, profession, hobbies, favourite_food) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, gender, education, profession, hobbies, favourite_food]);
    res.status(201).json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👧 Create Child User
exports.createChild = async (req, res) => {
  const { name, dob, email, password, gender, school, grades, hobbies, dream_career, favourite_sports, blood_group, parentId } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.execute("INSERT INTO users (id, name, dob, email, password) VALUES (?, ?, ?, ?, ?)",
      [id, name, dob, email, hashed]);
    await db.execute("INSERT INTO children (id, name, gender, school, grades, hobbies, dream_career, favourite_sports, blood_group, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, gender, school, grades, hobbies, dream_career, favourite_sports, blood_group, parentId]);
    res.status(201).json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔁 Update Parent
exports.updateParent = async (req, res) => {
  const { name, dob, email, gender, education, profession, hobbies, fav_food } = req.body;
  try {
    await db.execute("UPDATE users SET name=?, dob=?, email=? WHERE id=?", [name, dob, email, req.params.id]);
    await db.execute("UPDATE parents SET name=?, gender=?, education=?, profession=?, hobbies=?, favourite_food=? WHERE id=?",
      [name, gender, education, profession, hobbies, fav_food, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔁 Update Child
exports.updateChild = async (req, res) => {
  const { name, dob, email, gender, school, grades, hobbies, dream_career, favourite_sports, blood_group } = req.body;
  try {
    await db.execute("UPDATE users SET name=?, dob=?, email=? WHERE id=?", [name, dob, email, req.params.id]);
    await db.execute("UPDATE children SET name=?, gender=?, school=?, grades=?, hobbies=?, dream_career=?, favourite_sports=?, blood_group=? WHERE id=?",
      [name, gender, school, grades, hobbies, dream_career, favourite_sports, blood_group, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👀 Get Children of Parent
exports.getChildren = async (req, res) => {
  try {
    const [children] = await db.execute("SELECT * FROM children WHERE parentId = ?", [req.params.id]);
    res.json({ success: true, children });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📍 Get Location
exports.getLocation = async (req, res) => {
  try {
    const [loc] = await db.execute("SELECT * FROM locations WHERE id = ?", [req.params.id]);
    res.json({ success: true, location: loc[0] || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📍 Update Location
exports.updateLocation = async (req, res) => {
  const { city, state, country, latitude, longitude } = req.body;
  try {
    await db.execute(`
      INSERT INTO locations (id, city, state, country, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE city=?, state=?, country=?, latitude=?, longitude=?`,
      [req.params.id, city, state, country, latitude, longitude, city, state, country, latitude, longitude]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📤 Get All Users (Parent + Child)
exports.getUsers = async (req, res) => {
  try {
    const [parents] = await db.execute(`
      SELECT u.id, u.name, u.email, u.dob, 'parent' AS role,
      p.gender, p.education, p.profession FROM users u
      JOIN parents p ON u.id = p.id`);

    const [children] = await db.execute(`
      SELECT u.id, u.name, u.email, u.dob, 'child' AS role,
      c.school, c.grades, c.blood_group FROM users u
      JOIN children c ON u.id = c.id`);

    res.json({ success: true, data: [...parents, ...children] });
  } catch (error) {
    console.error("❌ Get Users Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
