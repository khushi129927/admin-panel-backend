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
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .container {
      background-color: #fff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      width: 300px;
    }
    h2 {
      margin-bottom: 20px;
      text-align: center;
      color: #333;
    }
    .input-group {
      position: relative;
      margin-bottom: 20px;
    }
    .input-group input {
      width: 100%;
      padding: 10px 35px 10px 10px;
      box-sizing: border-box;
      border-radius: 5px;
      border: 1px solid #ccc;
    }
    .toggle-btn {
      position: absolute;
      right: 10px;
      top: 9px;
      background: none;
      border: none;
      color: #007bff;
      font-size: 13px;
      cursor: pointer;
      padding: 0;
    }
    .submit-btn {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    .submit-btn:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>

  <div class="container">
    <h2>Reset Password</h2>
    <form id="resetForm">
      <div class="input-group">
        <input type="password" id="password" placeholder="New Password" required />
        <button type="button" class="toggle-btn" onclick="togglePassword('password', this)">Show</button>
      </div>
      <div class="input-group">
        <input type="password" id="confirmPassword" placeholder="Confirm Password" required />
        <button type="button" class="toggle-btn" onclick="togglePassword('confirmPassword', this)">Show</button>
      </div>
      <button type="submit" class="submit-btn">Reset Password</button>
    </form>
  </div>

  <script>
    // Get token from URL like ?token=abc123
    const token = new URLSearchParams(window.location.search).get("token");

    function togglePassword(id, btn) {
      const input = document.getElementById(id);
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
      } else {
        input.type = "password";
        btn.textContent = "Show";
      }
    }

    document.getElementById("resetForm").addEventListener("submit", async function (e) {
      e.preventDefault();

      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      const res = await fetch("https://neuroeq-env-1.eba-ex2g2zu6.ap-south-1.elasticbeanstalk.com/api/password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await res.json();
      alert(data.message || data.error || "Something went wrong");
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
