const db = require("../config/db");

const createOtpTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS otps (
      optsId VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )`;
  try {
    await db.query(query);
    console.log("✅ OTP table ready");
  } catch (err) {
    console.error("❌ OTP table error:", err.message);
  }
};

createOtpTable();
