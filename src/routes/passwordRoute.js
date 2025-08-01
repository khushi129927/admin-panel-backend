const express = require("express");
const path = require("path");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../controllers/passwordController");

// Serve static images
router.use('/images', express.static(path.join(__dirname, '../images')));

router.post("/forgot-password", forgotPassword);

router.get("/reset-password", (req, res) => {
  const token = req.query.token;
  const message = req.query.message || "";
  const type = req.query.type || "";

  if (!token) {
    return res.status(400).send("<h3>Invalid or missing token</h3>");
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
      width: 24px;
      height: 24px;
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
        <img src="/images/icons8-eye-50.png" class="toggle-eye" id="toggleNew" />
      </div>

      <label for="confirmPassword">Confirm Password</label>
      <div class="password-wrapper">
        <input type="password" id="confirmPassword" required />
        <img src="/images/icons8-eye-50.png" class="toggle-eye" id="toggleConfirm" />
      </div>

      <button type="submit">Reset Password</button>
    </form>
  </div>

  <script>
    function setupToggle(iconId, inputId) {
      const icon = document.getElementById(iconId);
      const input = document.getElementById(inputId);
      let isVisible = false;

      icon.addEventListener("click", () => {
        isVisible = !isVisible;
        input.type = isVisible ? "text" : "password";
        icon.src = isVisible ? "/images/icons8-closed-eye-24.png" : "/images/icons8-eye-50.png";
      });
    }

    setupToggle("toggleNew", "newPassword");
    setupToggle("toggleConfirm", "confirmPassword");

    const message = "${message}";
    const type = "${type}";
    if (message) {
      const bar = document.getElementById("msgBar");
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

router.post("/reset-password", async (req, res, next) => {
  const { newPassword, token } = req.body;

  try {
    const result = await resetPassword(newPassword, token); // You likely handle actual logic here

    if (result === "same-as-previous") {
      return res.redirect(`/api/password/reset-password?token=${token}&message=${encodeURIComponent("Password cannot be the same as the previous one.")}&type=error`);
    }

    if (result === "success") {
      return res.redirect(`/api/password/reset-password?token=${token}&message=${encodeURIComponent("Password updated successfully.")}&type=success`);
    }

    return res.status(400).send("Unexpected response.");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
