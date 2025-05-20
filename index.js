require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./src/config/db");

require("./src/models/taskModel");
require("./src/models/userModel");
require("./src/models/subscriptionModel");
require("./src/models/testModel");

const userRoutes = require("./src/routes/userRoute");
const taskRoutes = require("./src/routes/taskRoute");
const testRoutes = require("./src/routes/testRoute");
const subscriptionRoutes = require("./src/routes/subscriptionRoute");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ CORS: Only localhost (for development) or no origin (e.g. Postman, curl)
const allowedOrigins = [
  "http://localhost:3000", // local dev
  undefined                // allow no-origin requests (like Postman)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("🚫 CORS Error: Blocked origin =>", origin);
      callback(new Error("CORS Not Allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"]
}));

// ✅ Serve React build from admin-panel-frontend
app.use(express.static(path.join(__dirname, "admin-panel-frontend", "build")));

// ✅ API Routes
app.use("/api/users", userRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/test", testRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// ✅ Serve React index.html for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "admin-panel-frontend", "build", "index.html"));
});

// ✅ Error Handling
app.use((err, req, res, next) => {
  console.error("ERROR: ", err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

// ✅ Test DB Connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SHOW TABLES");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
server.setTimeout(500000); // 5 minutes
