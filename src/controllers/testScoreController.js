const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ➕ Save Test Score
exports.submitTestScore = async (req, res) => {
  const { childId, age, quarter, answers } = req.body;

  if (!childId || !age || !quarter || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    // 0. Check if child exists
    const [childExists] = await db.execute(
      "SELECT 1 FROM children WHERE childId = ?",
      [childId]
    );
    if (childExists.length === 0) {
      return res.status(404).json({ error: "Child not found in children table." });
    }

    // 1. Check if already submitted
    const [existing] = await db.execute(
      "SELECT 1 FROM test_scores WHERE childId = ? AND quarter = ?",
      [childId, quarter]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: "You have already submitted the test for this quarter.",
      });
    }

    // 2. Get all test questions for the age and quarter
    const [allTests] = await db.execute(
      "SELECT testId FROM tests WHERE age = ? AND quarter = ?",
      [age, quarter]
    );
    const requiredTestIds = allTests.map((t) => t.testId);

    // 3. Ensure all required questions are answered
    const answeredTestIds = answers.map((a) => a.testId);
    const unanswered = requiredTestIds.filter(id => !answeredTestIds.includes(id));

    if (unanswered.length > 0) {
      return res.status(400).json({
        error: "Please answer all the questions before submitting the test.",
        missingTestIds: unanswered
      });
    }

    // 4. Calculate score
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

    // 5. Save result
    const scoreId = uuidv4();
    await db.execute(
      `INSERT INTO test_scores (scoreId, childId, age, quarter, totalScore, submitted_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [scoreId, childId, age, quarter, totalScore]
    );

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
