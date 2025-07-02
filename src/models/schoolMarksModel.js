const createSchoolMarksTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS school_marks (
      markId VARCHAR(36) PRIMARY KEY,
      childId VARCHAR(100),
      subject VARCHAR(100),
      marks FLOAT,
      maxMarks FLOAT,
      examType VARCHAR(50),
      examDate DATE
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ school_marks table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating school_marks table:", err.message);
  }
};

createSchoolMarksTable();
module.exports = {createSchoolMarksTable};