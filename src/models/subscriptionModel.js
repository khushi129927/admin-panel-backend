const db = require("../config/db");

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err.stack);
    return;
  }
  console.log("Database connected");

   const createSubscriptionTable = `CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    plan VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )`;

  db.query(createSubscriptionTable, (err) => {
    if (err) console.error("Error creating Subscriptions table: ", err);
    else console.log("Subscriptions table is ready");
  });
});
