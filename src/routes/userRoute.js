const express = require("express");
const { registerUser, loginUser, getUsers } = require("../controllers/userController");
const router = express.Router();

router.post("/register-user", registerUser);
router.get("/login-user", loginUser);
router.get("/get-all-users", getUsers);

module.exports = router;
