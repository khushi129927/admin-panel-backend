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
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 2rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <h2>Reset Your Password</h2>
  <form id="resetForm" method="POST">
    <div class="form-group">
      <label for="newPassword">New Password:</label>
      <input type="password" id="newPassword" name="newPassword" required>
      <button type="button" onclick="togglePassword()">Show</button>
    </div>
    <button type="submit">Reset Password</button>
  </form>

  <script>
    function togglePassword() {
      const passwordInput = document.getElementById("newPassword");
      const toggleButton = event.target;

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.textContent = "Hide";
      } else {
        passwordInput.type = "password";
        toggleButton.textContent = "Show";
      }
    }

    // Attach the token to the form action dynamically
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById("resetForm");
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      if (token) {
        form.action = `/api/password/reset-password?token=${token}`;
      }
    });
  </script>
</body>
</html>

  `);
});

router.post("/reset-password", resetPassword);

module.exports = router;
