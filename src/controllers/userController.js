const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

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
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const [exists] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (exists.length) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.execute(
      `INSERT INTO users (userId, name, email, password, type) VALUES (?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, "parent"]
    );

    res.status(201).json({
      success: true,
      message: "Parent created successfully",
      parent: {
        userId,
        name,
        email
        // No password or type returned for security
      },
    });
  } catch (error) {
    console.error("❌ Create Parent Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// 👧 Create Child
// Helper to avoid SQL bind errors
const safe = (v) => v === undefined ? null : v;

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
    userId, // parentId
  } = req.body;

  if (!email || !password || !userId) {
    return res.status(400).json({ error: "Email, password, and userId are required." });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const childId = uuidv4();

    // Insert into users table
    await db.execute(
      "INSERT INTO users (userId, email, password, type) VALUES (?, ?, ?, ?)",
      [childId, safe(email), hashed, "child"]
    );

    // Insert into children table
    await db.execute(
      `INSERT INTO children (
        childId, name, dob, gender, school, grades, hobbies,
        dream_career, favourite_sports, blood_group, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        childId,
        safe(name),
        safe(dob),
        safe(gender),
        safe(school),
        safe(grades),
        safe(hobbies),
        safe(dream_career),
        safe(favourite_sports),
        safe(blood_group),
        safe(userId),
      ]
    );

    res.status(201).json({ 
      success: true, 
      child: { 
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
        userId,}
      });
  } catch (error) {
    console.error("❌ Create Child Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// 🔁 Update Parent
exports.updateParent = async (req, res) => {
  const {
    name,
    dob,
    email,
    gender,
    education,
    profession,
    hobbies,
    favourite_food
  } = req.body;

  const safe = (v) => v === undefined ? null : v;
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required in params." });
  }

  try {
    // Step 1: Check if user exists and is a parent
    const [userRows] = await db.execute(
      `SELECT * FROM users WHERE userId = ? AND type = 'parent'`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(403).json({ error: "Invalid user or not a parent." });
    }

    // Step 2: Proceed to update
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
        userId
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

  const childId = req.params.id;

  if (!childId) {
    return res.status(400).json({ error: "Child ID is required in params." });
  }

  try {
    // Step 1: Check if child exists in the children table
    const [childRows] = await db.execute(
      "SELECT * FROM children WHERE childId = ?",
      [childId]
    );

    if (childRows.length === 0) {
      return res.status(404).json({ error: "Child not found." });
    }

    // Step 2: Update users table
    await db.execute("UPDATE users SET name=?, dob=?, email=? WHERE userId=?", [
      name,
      dob,
      email,
      childId,
    ]);

    // Step 3: Update children table
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
        childId,
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
    const [children] = await db.execute("SELECT * FROM children WHERE userId = ?", [req.params.id]);
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
const geocodeCity = async (city, state, country) => {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const query = [city, state, country].filter(Boolean).join(", ");

  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}`
    );

    if (response.data?.results?.length) {
      const { lat, lng } = response.data.results[0].geometry;
      return { latitude: lat, longitude: lng };
    }
  } catch (err) {
    console.error("❌ Reverse Geocoding Failed:", err.message);
  }

  return { latitude: null, longitude: null };
};

exports.updateLocation = async (req, res) => {
  const { city, state, country, latitude, longitude } = req.body;
  const userId = req.params.userId;
  const safe = (v) => (typeof v === "undefined" ? null : v);

  if (!userId) return res.status(400).json({ error: "Missing userId" });

  let lat = safe(latitude);
  let lng = safe(longitude);

  // 🔄 If no lat/lng, try reverse geocoding from city/state/country
  if ((lat === null || lng === null) && (city || state || country)) {
    const coords = await geocodeCity(city, state, country);
    lat = coords.latitude;
    lng = coords.longitude;
  }

  // Still no lat/lng = reject
  if (lat === null || lng === null) {
    return res.status(400).json({ error: "Could not resolve coordinates" });
  }

  try {
    await db.execute(
      `INSERT INTO locations 
        (userId, city, state, country, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        city = ?, state = ?, country = ?, latitude = ?, longitude = ?`,
      [
        userId,
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Update Location Error:", error.message);
    res.status(500).json({ error: "Failed to update location" });
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
