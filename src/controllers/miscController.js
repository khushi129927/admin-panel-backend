// ✅ Basic API Health Check
exports.healthCheck = (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    message: "Server is running 🚀",
    timestamp: new Date(),
  });
};
