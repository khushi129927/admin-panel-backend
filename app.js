require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./src/config/db");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Load All Model Initializers
require("./src/models/userModel");
require("./src/models/taskModel");
require("./src/models/subscriptionModel");
require("./src/models/testModel");
require("./src/models/analyticsModel");
require("./src/models/locationModel");
require('./src/models/couponModel');
require("./src/models/termsModel");
require("./src/models/otpModel");
require("./src/models/paymentsModel");
require("./src/models/testScoreModel");
require("./src/models/taskScoreModel");
require("./src/models/taskAssignmentsModel");
require("./src/models/taskFeedbackModel");
require("./src/models/leaderboardModel");
require("./src/models/eqScoresModel");
require("./src/models/schoolMarksModel");
require("./src/models/achievementsModel");


// ✅ CORS: Allow local & tools like Postman
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "capacitor://localhost",
  "http://localhost",
  "https://admin-panel-backend-production-dd28.up.railway.app",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else {
      console.error("🚫 CORS BLOCKED:", origin);
      cb(new Error("CORS Not Allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"]
}));

// ✅ Serve React Build
app.use(express.static(path.join(__dirname, "admin-panel-frontend", "build")));


// ✅ API Routes
app.use("/api/users", require("./src/routes/userRoute"));
app.use("/api/task", require("./src/routes/taskRoute"));
app.use("/api/test", require("./src/routes/testRoute"));
app.use("/api/subscriptions", require("./src/routes/subscriptionRoute"));
app.use("/api/coupons", require("./src/routes/couponRoute"));
app.use("/api/analytics", require("./src/routes/analyticsRoute"));
app.use("/api/misc", require("./src/routes/miscRoute"));
app.use("/api/leaderboard", require("./src/routes/leaderboardRoute"));
app.use("/api/auth", require("./src/routes/authRoute"));
app.use("/api/otp", require("./src/routes/otpRoute"));
app.use("/api/testScore", require("./src/routes/testScoreRoute"));
app.use("/api/taskScore", require("./src/routes/taskScoreRoute"));
app.use("/api/password", require("./src/routes/passwordRoute"));

app.get("/api/ping", (req, res) => {
  res.send("✅ Server is up!");
});

app.get("*", (req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

app.use((err, req, res, next) => {
  console.error("❌ Error URL:", req.originalUrl);
  console.error("❌ Method:", req.method);
  console.error("❌ Headers:", req.headers);
  console.error("❌ Stack:", err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});


// ✅ Database Test Endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SHOW TABLES");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start Express Server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server live @ http://localhost:${PORT}`);
});
server.setTimeout(5 * 60 * 1000); // 5 mins


app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS time;");
    res.json({ dbTime: rows[0].time });
  } catch (err) {
    console.error("❌ DB Test Error:", err.message);
    res.status(500).json({ error: "Database not connected" });
  }
});
