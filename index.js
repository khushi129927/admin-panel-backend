require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

// Set up CORS with specific origin
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  
// Routes
app.use("/api/users", userRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/test", testRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Error Handling Middleware (at the end)
app.use((err, req, res, next) => {
  console.error("ERROR: ", err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});


app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SHOW TABLES");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/", (req, res) => {
    res.send("Welcome to the Admin Panel Backend API");
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
