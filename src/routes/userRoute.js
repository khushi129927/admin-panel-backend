const express = require("express");
const router = express.Router();
const {loginUser, createParent, createChild, updateParent, updateChild, getChildren, getChildrenById, getLocation, updateLocation, getUsers, getParentById} = require("../controllers/userController");
const {getCombinedChildRanksByUserId, getUserRankings} = require("../controllers/rankingConroller")
const auth = require("../middleware/authMiddleware");

// 🔐 Auth
router.post("/register", createParent);
router.post("/login", loginUser);

// 👨‍👩 Parent/Child
router.post("/create-parent", auth, createParent);
router.post("/create-child", auth, createChild);
router.put("/update-parent/:id", auth, updateParent);
router.put("/update-child/:childId", auth, updateChild);
router.get("/parent/:id/get-children", auth, getChildren);
router.get("/:childId/get-children", auth, getChildrenById);
router.get("/:id/get-parent", auth, getParentById);

// 📍 Location
router.get("/:id/get-location", auth, getLocation);
router.post("/:id/update-location", auth, updateLocation);

// 📤 All users (parent + child)
router.get("/get-all-users", getUsers);

// 🏆Ranking
router.get("/child-rankings/:id", auth, getCombinedChildRanksByUserId);
router.get("/rankings/:id", auth, getUserRankings);


module.exports = router;
