const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../controllers/passwordController");

router.post("/forgot-password", forgotPassword);

router.get("/reset-password", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send("<h3>Invalid or missing token</h3>");
  }

  // Serve the advanced HTML with token in query string
  res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reset Password</title>
</head>
<body>
  <h2>Reset Your Password</h2>
  <form id="resetForm" method="POST" action="/api/password/reset-password">
    <!-- token will be filled by JS -->
    <input type="hidden" name="token" id="token" />

    <label for="newPassword">New Password:</label><br/>
    <input type="password" name="newPassword" id="newPassword" required />
    <button type="button" id="toggleBtn">Show</button><br/><br/>

    <button type="submit">Reset Password</button>
  </form>

  <p id="msg"></p>

  <script>
    // extract token from URL and set hidden field
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      document.getElementById("token").value = token;
    } else {
      document.getElementById("msg").textContent = "Missing token in URL.";
    }

    // show/hide toggle
    document.getElementById("toggleBtn").addEventListener("click", () => {
      const pwd = document.getElementById("newPassword");
      if (pwd.type === "password") {
        pwd.type = "text";
        document.getElementById("toggleBtn").textContent = "Hide";
      } else {
        pwd.type = "password";
        document.getElementById("toggleBtn").textContent = "Show";
      }
    });
  </script>
</body>
</html>

  `);
});

router.post("/reset-password", resetPassword);

module.exports = router;
