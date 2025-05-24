const db = require("../config/db");

// 🏆 Get Leaderboard (Top Users by Avg EQ Score)
exports.getLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT u.id, u.name, AVG(r.score) AS avg_score
      FROM users u
      JOIN eq_results r ON u.id = r.userId
      GROUP BY u.id
      ORDER BY avg_score DESC
      LIMIT 20
    `);
    res.json({ success: true, leaderboard: rows });
  } catch (err) {
    console.error("❌ Leaderboard Error:", err.message);
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
};

// 📤 Share Rank (User Rank Info)
exports.getUserRank = async (req, res) => {
  const { userId } = req.params;
  try {
    const [users] = await db.execute(`
      SELECT userId, AVG(score) AS avg_score
      FROM eq_results
      GROUP BY userId
      ORDER BY avg_score DESC
    `);

    const rank = users.findIndex(u => u.userId === userId) + 1;
    const user = users.find(u => u.userId === userId);

    if (!user) return res.status(404).json({ error: "User not found in ranking." });

    res.json({ success: true, rank, avg_score: user.avg_score });
  } catch (err) {
    console.error("❌ Rank Share Error:", err.message);
    res.status(500).json({ error: "Failed to fetch user rank." });
  }
};
