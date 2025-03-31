const express = require("express");
const { addContent, getContent, uploadContent } = require("../controllers/contentController");
const router = express.Router();

router.post("/add", addContent);
router.get("/get-all", getContent);
router.post("/upload", uploadContent);

module.exports = router;
