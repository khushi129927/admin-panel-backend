const db = require("../config/db");

db.connect((err) => {
    if (err) {
      console.error("Database connection failed: ", err.stack);
      return;
    }
    console.log("Database connected");
  
    const createContentTable = `CREATE TABLE IF NOT EXISTS content (
      id VARCHAR(36) PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category VARCHAR(255) NOT NULL,
      age_group VARCHAR(50) NOT NULL
    )`;
  
    db.query(createContentTable, (err) => {
      if (err) console.error("Error creating Content table: ", err);
      else console.log("Content table is ready");
    });
  });
  