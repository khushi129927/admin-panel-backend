const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTestScore = async (req, res) => {
  const { childId, age, quarter, answers } = req.body;

  if (!childId || !age || !quarter || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    // Prevent duplicate submissions per child and quarter
    const [existing] = await db.execute(
      "SELECT * FROM test_scores WHERE childId = ? AND quarter = ?",
      [childId, quarter]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "This child has already submitted the test for this quarter.",
      });
    }

    let totalScore = 0;

    for (const answer of answers) {
      const [rows] = await db.execute(
        "SELECT * FROM tests WHERE testId = ?",
        [answer.testId]
      );
      if (!rows.length) continue;

      const test = rows[0];
      const selectedOption = answer.selectedOption;

      const points = test[`points${selectedOption}`];
      totalScore += Number(points) || 0;
    }

    const scoreId = uuidv4();
    const sql = `
      INSERT INTO test_scores (scoreId, childId, age, quarter, totalScore, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      scoreId,
      childId,
      age,
      quarter,
      totalScore,
      new Date(),
    ]);

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


exports.getScoresByChild = async (req, res) => {
  const { childId } = req.params;

  try {
    const [results] = await db.execute(
      "SELECT * FROM test_scores WHERE childId = ? ORDER BY submitted_at DESC",
      [childId]
    );
    res.status(200).json({ success: true, scores: results });
  } catch (err) {
    console.error("❌ Error fetching scores:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
