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
  const {
    name,
    dob,
    email,
    password,
    gender,
    education,
    profession,
    hobbies,
    favourite_food
  } = req.body;

  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required in params." });
  }

  try {
    // Fetch existing user data
    const [userRows] = await db.execute("SELECT * FROM users WHERE userId = ? AND type = ?", [userId, 'parent']);
    if (userRows.length === 0) {
      return res.status(403).json({ error: "Invalid user or not a parent." });
    }

    const existingUser = userRows[0];

    // Check if email changed and is already in use
    if (email && email !== existingUser.email) {
      const [emailRows] = await db.execute("SELECT * FROM users WHERE email = ? AND userId != ?", [email, userId]);
      if (emailRows.length > 0) {
        return res.status(400).json({ error: "Email already in use by another account." });
      }
    }

    // Determine final values
    const finalName = name === undefined || name === "" ? existingUser.name : name;
    const finalDob = dob === undefined || dob === "" ? existingUser.dob : dob;
    const finalEmail = email === undefined || email === "" ? existingUser.email : email;
    const finalGender = gender === undefined || gender === "" ? existingUser.gender : gender;
    const finalEducation = education === undefined || education === "" ? existingUser.education : education;
    const finalProfession = profession === undefined || profession === "" ? existingUser.profession : profession;
    const finalHobbies = hobbies === undefined || hobbies === "" ? existingUser.hobbies : hobbies;
    const finalFavFood = favourite_food === undefined || favourite_food === "" ? existingUser.favourite_food : favourite_food;
    const finalPassword = password ? await bcrypt.hash(password, 10) : existingUser.password;

    // Update users table
    await db.execute(
      `UPDATE users SET 
        name = ?, dob = ?, email = ?, gender = ?, education = ?, 
        profession = ?, hobbies = ?, favourite_food = ?, password = ?, type = ?
      WHERE userId = ?`,
      [
        finalName,
        finalDob,
        finalEmail,
        finalGender,
        finalEducation,
        finalProfession,
        finalHobbies,
        finalFavFood,
        finalPassword,
        'parent',
        userId
      ]
    );

    // Fetch and return updated parent
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

  const childId = req.params.childId;

  if (!childId) {
    return res.status(400).json({ error: "Child ID is required in params." });
  }

  try {
    // Step 1: Get existing child data
    const [childRows] = await db.execute("SELECT * FROM children WHERE childId = ?", [childId]);
    if (childRows.length === 0) {
      return res.status(404).json({ error: "Child not found." });
    }

    const [userRows] = await db.execute("SELECT * FROM users WHERE userId = ?", [childId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Child's user entry not found." });
    }

    const existingChild = childRows[0];
    const existingUser = userRows[0];

    // Step 2: If email is changing, ensure it's not used elsewhere
    if (email && email !== existingUser.email) {
      const [emailRows] = await db.execute(
        "SELECT * FROM users WHERE email = ? AND userId != ?",
        [email, childId]
      );
      if (emailRows.length > 0) {
        return res.status(400).json({ error: "Email already in use by another user." });
      }
    }

    const safe = (v, fallback) => (v === undefined || v === "") ? fallback : v;

    // Step 3: Update users table (if exists)
    await db.execute(
      "UPDATE users SET name = ?, dob = ?, email = ?, type = ? WHERE userId = ?",
      [
        safe(name, existingUser.name),
        safe(dob, existingUser.dob),
        safe(email, existingUser.email),
        "child",
        childId
      ]
    );

    // Step 4: Update children table
    await db.execute(
      `UPDATE children SET 
        name = ?, gender = ?, school = ?, grades = ?, hobbies = ?, 
        dream_career = ?, favourite_sports = ?, blood_group = ?
      WHERE childId = ?`,
      [
        safe(name, existingChild.name),
        safe(gender, existingChild.gender),
        safe(school, existingChild.school),
        safe(grades, existingChild.grades),
        safe(hobbies, existingChild.hobbies),
        safe(dream_career, existingChild.dream_career),
        safe(favourite_sports, existingChild.favourite_sports),
        safe(blood_group, existingChild.blood_group),
        childId
      ]
    );

    // Step 5: Fetch updated data
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
