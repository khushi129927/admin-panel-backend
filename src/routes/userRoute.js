const express = require("express");
const router = express.Router();
const {registerUser, loginUser, createParent, createChild, updateParent, updateChild, getChildren, getLocation, updateLocation, getUsers} = require("../controllers/userController");

// 🔐 Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// 👨‍👩 Parent/Child
router.post("/create-parent", createParent);
router.post("/create-child", createChild);
router.put("/update-parent/:id", updateParent);
router.put("/update-child/:id", updateChild);
router.get("/parent/:id/get-children", getChildren);

// 📍 Location
router.get("/:id/get-location", getLocation);
router.put("/:id/update-location", updateLocation);

// 📤 All users (parent + child)
router.get("/get-all-users", getUsers);

module.exports = router;
