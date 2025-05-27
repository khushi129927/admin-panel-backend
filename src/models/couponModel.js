const db = require("../config/db");

// 🏗️ Create Coupons Table
const createCouponsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS coupons (
      couponsId VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      discount DECIMAL(5,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  try {
    await db.execute(sql);
    console.log("✅ Coupons table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating coupons table:", err.message);
  }
};

// 🏗️ Create Coupon Redemptions Table
const createCouponRedemptionsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      couponRedemptionsId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36),
      couponId VARCHAR(36),
      redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
      FOREIGN KEY (couponId) REFERENCES coupons(couponsId) ON DELETE CASCADE
    )`;
  try {
    await db.execute(sql);
    console.log("✅ Coupon redemptions table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating coupon_redemptions table:", err.message);
  }
};

// 🔁 Initialize both tables
const initCouponTables = async () => {
  await createCouponsTable();
  await createCouponRedemptionsTable();
};

initCouponTables();
