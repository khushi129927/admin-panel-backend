const db = require("../config/db");

const createPaymentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      paymentId VARCHAR(100) PRIMARY KEY,
      childId VARCHAR(100) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      razorpay_payment_id VARCHAR(100) NOT NULL,
      razorpay_subscription_id VARCHAR(100),
      razorpay_signature VARCHAR(255),
      status VARCHAR(50) DEFAULT 'paid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await db.query(query);
    console.log("✅ Payments table ready");
  } catch (err) {
    console.error("❌ Payments table error:", err.message);
  }
};

createPaymentsTable();
