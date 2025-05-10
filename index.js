require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./src/config/db");
require("./src/models/taskModel");
require("./src/models/userModel"); 
require("./src/models/subscriptionModel");
require("./src/models/testModel");

const app = express();
app.use(express.json());
app.use(cors());

const userRoutes = require("./src/routes/userRoute");
const taskRoutes = require("./src/routes/taskRoute");
const subscriptionRoutes = require("./src/routes/subscriptionRoute");
const testRoutes = require("./src/routes/testRoute");

app.use("/api/users", userRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/test", testRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
