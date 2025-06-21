// controller/rankingController.js
const db = require("../config/db");

exports.getCombinedChildRanksByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter." });
  }

  try {
    // 1. Get all children of this user
    const [children] = await db.execute(
      `SELECT childId, name FROM children WHERE userId = ?`,
      [userId]
    );

    if (!children.length) {
      return res.status(404).json({ message: "No children found for this user." });
    }

    const childIds = children.map(c => c.childId);

    // 2. Get test scores for user's children
    const [testScores] = await db.execute(
      `SELECT childId, SUM(totalScore) AS testScore 
       FROM test_scores 
       WHERE childId IN (${childIds.map(() => "?").join(",")})
       GROUP BY childId`,
      childIds
    );

    // 3. Get task scores for user's children
    const [taskScores] = await db.execute(
      `SELECT childId, SUM(totalScore) AS taskScore 
       FROM task_scores 
       WHERE childId IN (${childIds.map(() => "?").join(",")})
       GROUP BY childId`,
      childIds
    );

    // 4. Merge scores
    const scoreMap = {};

    testScores.forEach(({ childId, testScore }) => {
      scoreMap[childId] = { childId, testScore: Number(testScore), taskScore: 0 };
    });

    taskScores.forEach(({ childId, taskScore }) => {
      if (!scoreMap[childId]) {
        scoreMap[childId] = { childId, testScore: 0, taskScore: Number(taskScore) };
      } else {
        scoreMap[childId].taskScore = Number(taskScore);
      }
    });

    const combinedScores = Object.values(scoreMap).map((item) => ({
      ...item,
      totalScore: item.testScore + item.taskScore,
      name: children.find(c => c.childId === item.childId)?.name || "Unknown"
    }));

    // 5. Sort and rank
    combinedScores.sort((a, b) => b.totalScore - a.totalScore);
    combinedScores.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.status(200).json({ success: true, data: combinedScores });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to get child ranks." });
  }
};
