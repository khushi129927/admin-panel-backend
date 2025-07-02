const createAchievementsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS achievements (
      achievementId VARCHAR(36) PRIMARY KEY,
      childId VARCHAR(100),
      type VARCHAR(50),
      title TEXT,
      level VARCHAR(50),
      date DATE
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ achievements table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating achievements table:", err.message);
  }
};

createAchievementsTable();
