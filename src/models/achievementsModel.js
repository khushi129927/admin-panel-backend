const createAchievementsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS achievements (
  achievementId VARCHAR(36) PRIMARY KEY,
  childId VARCHAR(100),
  category VARCHAR(50),
  description TEXT,
  rank VARCHAR(50),
  dateAchieved DATE
)`;


  try {
    await db.query(createTableQuery);
    console.log("✅ achievements table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating achievements table:", err.message);
  }
};

createAchievementsTable();
