const db = require("../config/db");

// 🏆 Get Leaderboard (Top Users by Avg EQ Score)
exports.getLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.childId, c.name AS childName, 
       COALESCE(AVG(ts.totalScore), 0) AS avg_test_score,
       COALESCE(AVG(tks.totalScore), 0) AS avg_task_score,
       (
         COALESCE(AVG(ts.totalScore), 0) + COALESCE(AVG(tks.totalScore), 0)
       ) / 2 AS combined_score
FROM children c
LEFT JOIN test_scores ts ON c.childId = ts.childId
LEFT JOIN task_scores tks ON c.childId = tks.childId
GROUP BY c.childId
ORDER BY combined_score DESC
LIMIT 20

    `);

    res.json({ success: true, leaderboard: rows });
  } catch (err) {
    console.error("❌ Leaderboard Error:", err.message);
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
};


// 📤 Share Rank (User Rank Info)
exports.getChildRank = async (req, res) => {
  const { childId } = req.params;

  try {
    const [all] = await db.execute(`
      SELECT c.childId, 
             (
               COALESCE(AVG(ts.totalScore), 0) + COALESCE(AVG(tks.totalScore), 0)
             ) / 2 AS combined_score
      FROM children c
      LEFT JOIN test_scores ts ON c.childId = ts.childId
      LEFT JOIN task_scores tks ON c.childId = tks.childId
      GROUP BY c.childId
      ORDER BY combined_score DESC
    `);

    const rank = all.findIndex(c => c.childId === childId) + 1;
    const child = all.find(c => c.childId === childId);

    if (!child) return res.status(404).json({ error: "Child not found in ranking." });

    res.json({ success: true, rank, combined_score: child.combined_score });
  } catch (err) {
    console.error("❌ Rank Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch rank." });
  }
};

