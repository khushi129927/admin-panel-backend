const express = require("express");
const router = express.Router();
const {registerUser, loginUser, createParent, createChild, updateParent, updateChild, getChildren, getLocation, updateLocation, getUsers} = require("../controllers/userController");

// 🔐 Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// 👨‍👩 Parent/Child
router.post("/parent", createParent);
router.post("/child", createChild);
router.put("/parent/:id", updateParent);
router.put("/child/:id", updateChild);
router.get("/parent/:id/children", getChildren);

// 📍 Location
router.get("/:id/location", getLocation);
router.put("/:id/location", updateLocation);

// 📤 All users (parent + child)
router.get("/get-all", getUsers);

module.exports = router;
