require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./src/config/db");
require("./src/models/contentModel");
require("./src/models/userModel"); 
require("./src/models/subscriptionModel");

const app = express();
app.use(express.json());
app.use(cors());

const userRoutes = require("./src/routes/userRoute");
const contentRoutes = require("./src/routes/contentRoute");
const subscriptionRoutes = require("./src/routes/subscriptionRoute");

app.use("/api/users", userRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
