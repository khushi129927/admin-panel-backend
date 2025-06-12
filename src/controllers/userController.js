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
    // Ensure all required fields are present
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Name, email, and both password fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const [exists] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (exists.length) {
      return res.status(400).json({ error: "Email already exists." });
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
        email,
      },
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
    userId, // parentId
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId (parentId) is required." });
  }

  try {
    const childId = uuidv4();
    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Insert into users even if email or password is missing
    await db.execute(
      "INSERT INTO users (userId, email, password, type) VALUES (?, ?, ?, ?)",
      [childId, email || null, hashedPassword, "child"]
    );

    await db.execute(
      `INSERT INTO children (
        childId, name, dob, gender, school, grades, hobbies,
        dream_career, favourite_sports, blood_group, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        childId,
        name || null,
        dob || null,
        gender || null,
        school || null,
        grades || null,
        hobbies || null,
        dream_career || null,
        favourite_sports || null,
        blood_group || null,
        userId,
      ]
    );

    res.status(201).json({
      success: true,
      childId,
      email: email || null,
    });
  } catch (error) {
    console.error("❌ Create Child Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};



// 🔁 Update Parent
exports.updateParent = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required in params." });
  }

  try {
    const [userRows] = await db.execute(
      `SELECT * FROM users WHERE userId = ? AND type = 'parent'`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(403).json({ error: "Invalid user or not a parent." });
    }

    const existing = userRows[0];

    const {
      name = existing.name,
      dob = existing.dob,
      email = existing.email,
      gender = existing.gender,
      education = existing.education,
      profession = existing.profession,
      hobbies = existing.hobbies,
      favourite_food = existing.favourite_food
    } = req.body;

    // If user changed email, check for uniqueness
    if (email !== existing.email) {
      const [emailRows] = await db.execute(
        `SELECT * FROM users WHERE email = ? AND userId != ?`,
        [email, userId]
      );
      if (emailRows.length > 0) {
        return res.status(400).json({ error: "Email already in use by another account." });
      }
    }

    await db.execute(
      `UPDATE users SET 
        name = ?, dob = ?, email = ?, gender = ?, education = ?, 
        profession = ?, hobbies = ?, favourite_food = ?, type = ?
      WHERE userId = ?`,
      [
        name,
        dob,
        email,
        gender,
        education,
        profession,
        hobbies,
        favourite_food,
        'parent',
        userId
      ]
    );

    const [updatedParent] = await db.execute("SELECT * FROM users WHERE userId = ?", [userId]);

    res.json({
      success: true,
      parent: updatedParent[0]
    });
  } catch (error) {
    console.error("❌ Update Parent Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};






// 🔁 Update Child
exports.updateChild = async (req, res) => {
  const childId = req.params.childId;

  if (!childId) {
    return res.status(400).json({ error: "Child ID is required in params." });
  }

  try {
    const [[user]] = await db.execute("SELECT * FROM users WHERE userId = ?", [childId]);
    const [[child]] = await db.execute("SELECT * FROM children WHERE childId = ?", [childId]);

    if (!child || !user) {
      return res.status(404).json({ error: "Child not found." });
    }

    const {
      name = child.name,
      dob = user.dob,
      email = user.email,
      gender = child.gender,
      school = child.school,
      grades = child.grades,
      hobbies = child.hobbies,
      dream_career = child.dream_career,
      favourite_sports = child.favourite_sports,
      blood_group = child.blood_group
    } = req.body;

    // If email is changed, check if taken
    if (email !== user.email) {
      const [emailRows] = await db.execute(
        "SELECT * FROM users WHERE email = ? AND userId != ?",
        [email, childId]
      );
      if (emailRows.length > 0) {
        return res.status(400).json({ error: "Email already in use by another user." });
      }
    }

    // Update users
    await db.execute(
      "UPDATE users SET name = ?, dob = ?, email = ?, type = ? WHERE userId = ?",
      [name, dob, email, "child", childId]
    );

    // Update children
    await db.execute(
      `UPDATE children SET 
        name = ?, gender = ?, school = ?, grades = ?, hobbies = ?, 
        dream_career = ?, favourite_sports = ?, blood_group = ?
      WHERE childId = ?`,
      [
        name,
        gender,
        school,
        grades,
        hobbies,
        dream_career,
        favourite_sports,
        blood_group,
        childId
      ]
    );

    const [updatedUser] = await db.execute("SELECT * FROM users WHERE userId = ?", [childId]);
    const [updatedChild] = await db.execute("SELECT * FROM children WHERE childId = ?", [childId]);

    res.json({
      success: true,
      child: {
        ...updatedUser[0],
        ...updatedChild[0]
      }
    });
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

exports.getChildrenById = async (req, res) => {
  try {
    const [children] = await db.execute("SELECT * FROM children WHERE childId = ?", [req.params.childId]);
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

exports.getParentById = async (req, res) => {
  try {
    const [parent] = await db.execute("SELECT * FROM users WHERE userId = ?", [req.params.userId]);
    res.json({ success: true, parent });
  } catch (error) {
    console.error("❌ Get Parent Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
