const db = require("../config/db");

// 📈 1. Get EQ Progress (user's score over time)
exports.getEQProgress = async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT score, submitted_at FROM eq_results WHERE userId = ? ORDER BY submitted_at ASC`,
      [userId]
    );
    res.json({ success: true, progress: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch EQ progress." });
  }
};

// 🧮 2. Get Community Comparison (avg score vs peers)
exports.getCommunityComparison = async (req, res) => {
  const { userId } = req.params;
  try {
    const [[userScore]] = await db.execute(
      `SELECT AVG(score) as user_avg FROM eq_results WHERE userId = ?`,
      [userId]
    );
    const [[allScore]] = await db.execute(
      `SELECT AVG(score) as global_avg FROM eq_results`
    );
    res.json({ success: true, user_avg: userScore.user_avg, global_avg: allScore.global_avg });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comparison." });
  }
};

// 📊 3. Get Task Completion Stats (status count by user)
exports.getTaskCompletionStats = async (req, res) => {
  const { userId } = req.params;
  try {
    const [stats] = await db.execute(
      `SELECT status, COUNT(*) as count FROM task_assignments WHERE userId = ? GROUP BY status`,
      [userId]
    );
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task stats." });
  }
};
