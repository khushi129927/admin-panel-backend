const express = require("express");
const router = express.Router();
const {loginUser, createParent, createChild, updateParent, updateChild, getChildren, getLocation, updateLocation, getUsers} = require("../controllers/userController");

// 🔐 Auth
router.post("/register", createParent);
router.post("/login", loginUser);

// 👨‍👩 Parent/Child
router.post("/create-parent", createParent);
router.post("/create-child", createChild);
router.put("/update-parent/:userId", updateParent);
router.put("/update-child/:childId", updateChild);
router.get("/parent/:userId/get-children", getChildren);

// 📍 Location
router.get("/:userId/get-location", getLocation);
router.post("/:userId/update-location", updateLocation);

// 📤 All users (parent + child)
router.get("/get-all-users", getUsers);

module.exports = router;
