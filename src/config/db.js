const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000, // 20 seconds
  ssl: {
    rejectUnauthorized: true
  }
});
pool.getConnection()
  .then(connection => {
    console.log("✅ Database connected");
    connection.release();
  })
  .catch(error => {
    console.error("❌ Database connection failed:", error);
  });

module.exports = pool;
