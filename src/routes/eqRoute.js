const express = require("express");
const router = express.Router();
const eqController = require("../controllers/eqController");

router.get("/test", eqController.getEQTest);
router.post("/submit", eqController.submitEQTest);
router.get("/score/:userId", eqController.getEQScore);

module.exports = router;
