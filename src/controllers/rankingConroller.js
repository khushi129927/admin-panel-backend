// controller/rankingController.js
const db = require("../config/db");

exports.getCombinedChildRanksByUserId = async (req, res) => {
  const userId  = req.params.id;

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


exports.getUserRankings = async (req, res) => {
  try {
    const userId = req.params.id;

    // Step 1: Get location of the user
    const [[location]] = await db.execute(
      "SELECT city, state, country FROM locations WHERE userId = ?",
      [userId]
    );
    if (!location) {
      return res.status(404).json({ message: "Location not found for user" });
    }

    // Step 2: Get all children and map childId -> userId
    const [children] = await db.execute("SELECT childId, userId FROM children");

    const childToUserMap = {};
    for (const row of children) {
      childToUserMap[row.childId] = row.userId;
    }

    // Step 3: Get total EQ scores per childId
    const [scoreRows] = await db.execute(`
      SELECT childId, SUM(totalScore) AS totalEQScore
      FROM (
        SELECT childId, totalScore FROM task_scores
        UNION ALL
        SELECT childId, totalScore FROM test_scores
      ) AS all_scores
      GROUP BY childId
    `);

    // Step 4: Aggregate scores per userId
    const userScores = {};
    for (const row of scoreRows) {
      const user = childToUserMap[row.childId];
      if (!userScores[user]) userScores[user] = 0;
      userScores[user] += Number(row.totalEQScore) || 0;
    }

    // Step 5: Get all users' locations for filtering
    const [allLocations] = await db.execute("SELECT userId, city, state, country FROM locations");

    const getUsersByRegion = (filterFn) =>
      Object.keys(userScores).filter(uid =>
        filterFn(allLocations.find(loc => loc.userId === uid))
      );

    const globalUsers = Object.keys(userScores);
    const stateUsers = getUsersByRegion(loc => loc?.state === location.state);
    const cityUsers = getUsersByRegion(loc => loc?.city === location.city);

    const getRankNumber = (userList) => {
      const sorted = userList
        .map(uid => ({ userId: uid, total: userScores[uid] }))
        .sort((a, b) => b.total - a.total);

      const rank = sorted.findIndex(u => u.userId === userId) + 1;
      return {
        rank,
        outOf: sorted.length
      };
    };

    res.json({
      userId,
      totalEQScore: userScores[userId] || 0,
      ranks: {
        global: getRankNumber(globalUsers),
        state: getRankNumber(stateUsers),
        city: getRankNumber(cityUsers)
      }
    });

  } catch (error) {
    console.error("❌ getUserRankings error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
