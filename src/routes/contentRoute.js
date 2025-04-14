const express = require("express");
const { addQuestion, getContent, uploadContent, deleteQuestion, editQuestion } = require("../controllers/contentController");
const router = express.Router();

router.post("/add", addQuestion);
router.get("/get-all", getContent);  
router.post("/upload", uploadContent);
router.delete("/delete", deleteQuestion); 
router.put("/edit", editQuestion);        


module.exports = router;
