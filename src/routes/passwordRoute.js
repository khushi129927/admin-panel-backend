const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../controllers/passwordController");

router.post("/forgot-password", forgotPassword);

router.get("/reset-password", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send("<h3>Invalid or missing token</h3>");
  }

  res.send(`
    <html>
      <head><title>Reset Password</title></head>
      <body>
        <h2>Reset Your Password</h2>
        <form action="/api/password/reset-password" method="POST">
          <input type="hidden" name="token" value="${token}" />
          <label>New Password:</label><br/>
          <input type="password" name="newPassword" required /><br/><br/>
          <button type="submit">Reset Password</button>
        </form>
      </body>
    </html>
  `);
});

router.post("/reset-password", resetPassword);

module.exports = router;
