const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

exports.addContent = (req, res) => {
    const { question, answer, category, age_group } = req.body;
    const id = uuidv4();
  
    const sql = "INSERT INTO Content (id, question, answer, category, age_group) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [id, question, answer, category, age_group], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, message: "Content added" });
    });
  };
  
  
exports.getContent = (req, res) => {
  const sql = "SELECT * FROM content";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

exports.uploadContent = (req, res) => {
    console.log("Upload route hit!");  

    upload(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      console.log("File received:", req.file.originalname); 

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const sql = "INSERT INTO Content (id, question, answer, category, age_group) VALUES ?";
      const values = data.map((row) => [uuidv4(), row.question, row.answer, row.category, row.age_group]);

      db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ success: true, message: "Data uploaded successfully" });
      });
    });
};
