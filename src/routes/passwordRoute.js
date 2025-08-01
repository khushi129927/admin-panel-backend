const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../controllers/passwordController");

router.post("/forgot-password", forgotPassword);

router.get("/reset-password", (req, res) => {
  const token = req.query.token;
  const message = req.query.message || "";

  if (!token) {
    return res.status(400).send("<h3>Invalid or missing token</h3>");
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reset Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f2f2f2;
      padding: 40px;
      display: flex;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 30px 40px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }
    h2 {
      text-align: center;
      margin-bottom: 20px;
    }
    label {
      font-weight: bold;
      display: block;
      margin-top: 15px;
    }
    input[type="password"] {
      width: 100%;
      padding: 10px;
      margin-top: 5px;
      margin-bottom: 15px;
      border-radius: 5px;
      border: 1px solid #ccc;
    }
    .password-wrapper {
      position: relative;
    }
    .toggle-eye {
      position: absolute;
      right: 10px;
      top: 13px;
      cursor: pointer;
    }
    .message-bar {
      background: #ffdddd;
      color: #b40000;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
      display: none;
      font-size: 14px;
      text-align: center;
    }
    button {
      background: #007bff;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      width: 100%;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>

    <div id="msgBar" class="message-bar">${message}</div>

    <form id="resetForm" method="POST" action="/api/password/reset-password">
      <input type="hidden" name="token" value="${token}" />

      <label for="newPassword">New Password</label>
      <div class="password-wrapper">
        <input type="password" name="newPassword" id="newPassword" required />
        <span class="toggle-eye" id="toggleNew">👁️</span>
      </div>

      <label for="confirmPassword">Confirm Password</label>
      <div class="password-wrapper">
        <input type="password" id="confirmPassword" required />
        <span class="toggle-eye" id="toggleConfirm">👁️</span>
      </div>

      <button type="submit">Reset Password</button>
    </form>
  </div>

  <script>
    // Eye toggles
    document.getElementById("toggleNew").addEventListener("click", () => {
      const pwd = document.getElementById("newPassword");
      pwd.type = pwd.type === "password" ? "text" : "password";
    });

    document.getElementById("toggleConfirm").addEventListener("click", () => {
      const pwd = document.getElementById("confirmPassword");
      pwd.type = pwd.type === "password" ? "text" : "password";
    });

    // Show error if message exists
    if ("${message}") {
      document.getElementById("msgBar").style.display = "block";
    }

    // Confirm password match check before submit
    document.getElementById("resetForm").addEventListener("submit", function(e) {
      const newPwd = document.getElementById("newPassword").value;
      const confirmPwd = document.getElementById("confirmPassword").value;

      if (newPwd !== confirmPwd) {
        e.preventDefault();
        const msgBar = document.getElementById("msgBar");
        msgBar.textContent = "Passwords do not match.";
        msgBar.style.display = "block";
      }
    });
  </script>
</body>
</html>
  `);
});


router.post("/reset-password", resetPassword);

module.exports = router;
