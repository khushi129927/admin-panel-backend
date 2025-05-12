const express = require("express");
const {  getTask, uploadTask, testDatabase } = require("../controllers/taskController");
const router = express.Router();


router.get("/get-all", getTask);  
router.post("/upload", uploadTask);        
router.get("/test-database", testDatabase);

module.exports = router;
