const express = require("express");
const router = express.Router();
const {loginUser, createParent, createChild, updateParent, updateChild, getChildren, getChildrenById, getLocation, updateLocation, getUsers, getParentById} = require("../controllers/userController");
const {getCombinedChildRanksByUserId} = require("../controllers/rankingConroller")

// 🔐 Auth
router.post("/register", createParent);
router.post("/login", loginUser);

// 👨‍👩 Parent/Child
router.post("/create-parent", createParent);
router.post("/create-child", createChild);
router.put("/update-parent/:id", updateParent);
router.put("/update-child/:childId", updateChild);
router.get("/parent/:id/get-children", getChildren);
router.get("/:childId/get-children", getChildrenById);
router.get("/:userId/get-parent", getParentById);

// 📍 Location
router.get("/:id/get-location", getLocation);
router.post("/:id/update-location", updateLocation);

// 📤 All users (parent + child)
router.get("/get-all-users", getUsers);

// 🏆Ranking
router.get("/child-rankings/:userId", getCombinedChildRanksByUserId);

module.exports = router;
