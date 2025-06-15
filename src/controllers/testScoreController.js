const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ➕ Save Score
exports.submitTestScore = async (req, res) => {
  const { userId, age, quarter, answers } = req.body;

  if (!userId || !age || !quarter || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    let totalScore = 0;

    for (const answer of answers) {
      const [rows] = await db.execute("SELECT * FROM tests WHERE testId = ?", [answer.testId]);
      if (!rows.length) continue;

      const test = rows[0];
      const selectedOption = answer.selectedOption;

      // Dynamically get the points
      const points = test[`points${selectedOption}`];
      totalScore += Number(points) || 0;
    }

    const scoreId = uuidv4();
    const sql = `INSERT INTO test_scores (scoreId, userId, age, quarter, totalScore, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`;

    await db.execute(sql, [scoreId, userId, age, quarter, totalScore, new Date()]);

    res.status(201).json({
      success: true,
      message: "Test score submitted successfully",
      totalScore,
    });
  } catch (err) {
    console.error("❌ Error saving score:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// 📤 Get Scores by User
exports.getScoresByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await db.execute("SELECT * FROM test_scores WHERE userId = ? ORDER BY submitted_at DESC", [userId]);
    res.status(200).json({ success: true, scores: results });
  } catch (err) {
    console.error("❌ Error fetching scores:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
