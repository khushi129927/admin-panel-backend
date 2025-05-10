const db = require("../config/db");

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err.stack);
    return;
  }
  console.log("Database connected");

  const createUserTable = `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dob DATE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  )`;

  db.query(createUserTable, (err) => {
    if (err) console.error("Error creating Users table: ", err);
    else console.log("Users table is ready");
  });
});
