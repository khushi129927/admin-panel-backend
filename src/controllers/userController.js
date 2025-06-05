const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// 📅 Date Formatter
function formatDate(dateString) {
  const [day, month, year] = dateString.split("-");
  return `${year}-${month}-${day}`;
}

// 🔐 Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(401).json({ error: "Invalid credentials" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.userId, email: user.email, type: user.type }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ success: true, token, userId: user.userId });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createParent = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check if user already exists
    const [exists] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (exists.length) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert only name, email, and hashed password
    await db.execute(
      `INSERT INTO users (userId, name, email, password) VALUES (?, ?, ?, ?)`,
      [userId, name, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Parent created successfully",
      userId,
    });
  } catch (error) {
    console.error("❌ Create Parent Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// 👧 Create Child
exports.createChild = async (req, res) => {
  const {
    name,
    dob,
    email,
    password,
    gender,
    school,
    grades,
    hobbies,
    dream_career,
    favourite_sports,
    blood_group,
    parentId,
  } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const childId = uuidv4();

    await db.execute("INSERT INTO users (userId, email, password, type) VALUES (?, ?, ?, ?)", [
      childId,
      email,
      hashed,
      "child",
    ]);

    await db.execute(
      `INSERT INTO children (
        childId, name, dob, gender, school, grades, hobbies,
        dream_career, favourite_sports, blood_group, parentId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        childId,
        name,
        dob,
        gender,
        school,
        grades,
        hobbies,
        dream_career,
        favourite_sports,
        blood_group,
        parentId,
      ]
    );

    res.status(201).json({ success: true, childId });
  } catch (error) {
    console.error("❌ Create Child Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔁 Update Parent
exports.updateParent = async (req, res) => {
  const { name, dob, email, gender, education, profession, hobbies, favourite_food } = req.body;

  // Convert undefined fields to NULL
  const safe = (v) => v === undefined ? null : v;

  try {
    await db.execute(
      `UPDATE users SET 
        name = ?, dob = ?, email = ?, gender = ?, education = ?, 
        profession = ?, hobbies = ?, favourite_food = ?
      WHERE userId = ?`,
      [
        safe(name),
        safe(dob),
        safe(email),
        safe(gender),
        safe(education),
        safe(profession),
        safe(hobbies),
        safe(favourite_food),
        req.params.id
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Update Parent Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🔁 Update Child
exports.updateChild = async (req, res) => {
  const {
    name,
    dob,
    email,
    gender,
    school,
    grades,
    hobbies,
    dream_career,
    favourite_sports,
    blood_group,
  } = req.body;

  try {
    await db.execute("UPDATE users SET name=?, dob=?, email=? WHERE userId=?", [
      name,
      dob,
      email,
      req.params.id,
    ]);

    await db.execute(
      `UPDATE children SET 
        name=?, gender=?, school=?, grades=?, hobbies=?, 
        dream_career=?, favourite_sports=?, blood_group=?
      WHERE childId=?`,
      [
        name,
        gender,
        school,
        grades,
        hobbies,
        dream_career,
        favourite_sports,
        blood_group,
        req.params.id,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Update Child Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 👀 Get Children of Parent
exports.getChildren = async (req, res) => {
  try {
    const [children] = await db.execute("SELECT * FROM children WHERE parentId = ?", [req.params.id]);
    res.json({ success: true, children });
  } catch (error) {
    console.error("❌ Get Children Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 📍 Get Location
exports.getLocation = async (req, res) => {
  try {
    const [loc] = await db.execute("SELECT * FROM locations WHERE userId = ?", [req.params.userId]);
    res.json({ success: true, location: loc[0] || {} });
  } catch (error) {
    console.error("❌ Get Location Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 📍 Update Location
exports.updateLocation = async (req, res) => {
  const { city, state, country, latitude, longitude } = req.body;

  const safe = (v) => v === undefined ? null : v;

  const lat = safe(latitude);
  const lng = safe(longitude);

  if (lat === null || lng === null) {
    return res.status(400).json({ error: "Latitude and Longitude are required" });
  }

  try {
    await db.execute(
      `INSERT INTO locations 
        (userId, city, state, country, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        city=?, state=?, country=?, latitude=?, longitude=?`,
      [
        req.params.userId,
        safe(city),
        safe(state),
        safe(country),
        lat,
        lng,
        safe(city),
        safe(state),
        safe(country),
        lat,
        lng
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Update Location Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// 📤 Get All Users
exports.getUsers = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Users Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
