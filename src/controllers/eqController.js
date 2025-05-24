const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// 🧠 GET EQ Test Questions
exports.getEQTest = async (req, res) => {
  try {
    const [questions] = await db.execute("SELECT * FROM eq_questions ORDER BY id ASC");
    res.json({ success: true, questions });
  } catch (err) {
    console.error("❌ EQ Test Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

// 📝 Submit EQ Test Answers
exports.submitEQTest = async (req, res) => {
  const { userId, answers } = req.body;
  if (!userId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid submission format" });
  }

  try {
    const resultId = uuidv4();
    const timestamp = new Date();

    let totalScore = 0;
    for (const ans of answers) {
      totalScore += ans.score; // assume `score` is calculated client-side or sent directly
      await db.execute(
        `INSERT INTO eq_answers (id, resultId, userId, questionId, answer, score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), resultId, userId, ans.questionId, ans.answer, ans.score, timestamp]
      );
    }

    const averageScore = totalScore / answers.length;
    await db.execute(
      `INSERT INTO eq_results (id, userId, resultId, score, submitted_at)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), userId, resultId, averageScore, timestamp]
    );

    res.status(201).json({ success: true, score: averageScore });
  } catch (err) {
    console.error("❌ Submit EQ Test Error:", err.message);
    res.status(500).json({ error: "Failed to submit test" });
  }
};

// 📈 Get EQ Score History
exports.getEQScore = async (req, res) => {
  try {
    const [results] = await db.execute(
      `SELECT score, submitted_at FROM eq_results WHERE userId = ? ORDER BY submitted_at DESC`,
      [req.params.userId]
    );
    res.json({ success: true, history: results });
  } catch (err) {
    console.error("❌ Get EQ Score Error:", err.message);
    res.status(500).json({ error: "Failed to retrieve score" });
  }
};
