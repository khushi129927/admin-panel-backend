const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

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

    // 1. Extract quarter number (e.g., from "Quarter 3" => 3)
    const quarterNum = parseInt(quarter.replace(/[^0-9]/g, ""));
    if (isNaN(quarterNum)) {
      return res.status(400).json({ error: "Invalid quarter format." });
    }

    // 2. Get all submitted quarters for this child
    const [submittedQuarters] = await db.execute(
      "SELECT quarter FROM test_scores WHERE childId = ?",
      [childId]
    );

    const submittedQuarterNums = submittedQuarters.map(q =>
      parseInt(q.quarter.replace(/[^0-9]/g, ""))
    );

    for (let i = 1; i < quarterNum; i++) {
      if (!submittedQuarterNums.includes(i)) {
        return res.status(403).json({
          error: `You must complete Quarter ${i} before attempting Quarter ${quarterNum}.`
        });
      }
    }

    // 3. Check if already submitted for this quarter
    const [existing] = await db.execute(
      "SELECT 1 FROM test_scores WHERE childId = ? AND quarter = ?",
      [childId, quarter]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: "You have already submitted the test for this quarter."
      });
    }

    // 4. Validate answers
    let totalScore = 0;
    for (const answer of answers) {
      const selectedOption = answer.selectedOption;

      if (!["1", "2", "3", "4"].includes(selectedOption)) {
        return res.status(400).json({
          error: `Each question must have a selected option between 1 to 4. Missing/invalid selection for testId: ${answer.testId}`
        });
      }

      const [rows] = await db.execute(
        "SELECT * FROM tests WHERE testId = ?",
        [answer.testId]
      );
      if (!rows.length) continue;

      const test = rows[0];
      const points = test[`points${selectedOption}`];
      totalScore += Number(points) || 0;
    }

    // 5. Save test result
    const scoreId = uuidv4();
    await db.execute(
      `INSERT INTO test_scores (scoreId, childId, age, quarter, totalScore, submitted_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [scoreId, childId, age, quarter, totalScore]
    );

    res.status(201).json({
      success: true,
      message: "Test score submitted successfully",
      totalScore
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
