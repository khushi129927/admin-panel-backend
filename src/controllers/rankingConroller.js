// controller/rankingController.js
const db = require("../config/db");

exports.getCombinedChildRanks = async (req, res) => {
  try {
    // 1. Get total test scores per child
    const [testScores] = await db.execute(
      `SELECT childId, SUM(totalScore) AS testScore 
       FROM test_scores 
       GROUP BY childId`
    );

    // 2. Get total task scores per child
    const [taskScores] = await db.execute(
      `SELECT childId, SUM(totalScore) AS taskScore 
       FROM task_scores 
       GROUP BY childId`
    );

    // 3. Merge scores by childId
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

    // 4. Convert to array and calculate total score
    const combinedScores = Object.values(scoreMap).map((item) => ({
      ...item,
      totalScore: item.testScore + item.taskScore,
    }));

    // 5. Sort by totalScore descending and assign ranks
    combinedScores.sort((a, b) => b.totalScore - a.totalScore);
    combinedScores.forEach((item, index) => {
      item.rank = index + 1;
    });

    // 6. Get child names for better display
    for (const item of combinedScores) {
      const [child] = await db.execute("SELECT name FROM children WHERE childId = ?", [item.childId]);
      item.name = child[0]?.name || "Unknown";
    }

    res.status(200).json({ success: true, data: combinedScores });
  } catch (err) {
    console.error("❌ Error calculating ranks:", err);
    res.status(500).json({ error: "Failed to calculate ranks." });
  }
};
