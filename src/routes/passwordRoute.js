const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db"); // adjust if your DB config is named differently

router.post("/forgot-password", forgotPassword);

router.get("/reset-password", (req, res) => {
  const token = req.query.token;
  const message = req.query.message || "";
  const type = req.query.type || "";

  if (!token) {
    return res.send(`
      <div style="padding: 20px; background: #ffdddd; color: #b40000; text-align: center;">
        Invalid or missing token
      </div>
    `);
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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
    .password-wrapper {
      position: relative;
    }
    input[type="password"], input[type="text"] {
      width: 100%;
      padding: 10px 40px 10px 10px;
      margin-top: 5px;
      margin-bottom: 15px;
      border-radius: 5px;
      border: 1px solid #ccc;
      box-sizing: border-box;
    }
    .toggle-eye {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 14px;
      user-select: none;
    }
    .message-bar {
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
      font-size: 14px;
      text-align: center;
      display: none;
    }
    .error-bar {
      background: #ffdddd;
      color: #b40000;
    }
    .success-bar {
      background: #ddffdd;
      color: #007300;
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
        <span class="toggle-eye" id="toggleNew">Show</span>
      </div>

      <label for="confirmPassword">Confirm Password</label>
      <div class="password-wrapper">
        <input type="password" id="confirmPassword" required />
        <span class="toggle-eye" id="toggleConfirm">Show</span>
      </div>

      <button type="submit">Reset Password</button>
    </form>
  </div>

  <script>
    function setupToggle(id, inputId) {
      const icon = document.getElementById(id);
      const input = document.getElementById(inputId);
      icon.addEventListener("click", () => {
        if (input.type === "password") {
          input.type = "text";
          icon.textContent = "Hide";
        } else {
          input.type = "password";
          icon.textContent = "Show";
        }
      });
    }

    setupToggle("toggleNew", "newPassword");
    setupToggle("toggleConfirm", "confirmPassword");

    const message = "${message}";
    const type = "${type}";
    const bar = document.getElementById("msgBar");
    if (message) {
      bar.style.display = "block";
      bar.classList.add(type === "success" ? "success-bar" : "error-bar");
    }

    document.getElementById("resetForm").addEventListener("submit", function(e) {
      const newPwd = document.getElementById("newPassword").value;
      const confirmPwd = document.getElementById("confirmPassword").value;

      if (newPwd !== confirmPwd) {
        e.preventDefault();
        const msgBar = document.getElementById("msgBar");
        msgBar.textContent = "Passwords do not match.";
        msgBar.classList.remove("success-bar");
        msgBar.classList.add("error-bar");
        msgBar.style.display = "block";
      }
    });
  </script>
</body>
</html>
  `);
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE resetToken = ?", [token]);
    if (!rows.length) {
      return res.redirect(`/api/password/reset-password?token=${token}&message=${encodeURIComponent("Invalid or expired token.")}&type=error`);
    }

    const user = rows[0];
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.redirect(`/api/password/reset-password?token=${token}&message=${encodeURIComponent("Password cannot be the same as the previous one.")}&type=error`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ?, resetToken = NULL WHERE userId = ?", [hashedPassword, user.userId]);

    return res.redirect(`/api/password/reset-password?token=${token}&message=${encodeURIComponent("Password updated successfully.")}&type=success`);
  } catch (error) {
    return res.redirect(`/api/password/reset-password?token=${token}&message=${encodeURIComponent("An error occurred.")}&type=error`);
  }
});

module.exports = router;
