const express = require("express");
const router = express.Router();
const eqController = require("../controllers/eqController");
const auth = require("../middleware/authMiddleware");

router.get("/test", auth, eqController.getEQTest);
router.post("/submit-test", auth, eqController.submitEQTest);
router.get("/get-eq-score/:userId", auth, eqController.getEQScore);

module.exports = router;
