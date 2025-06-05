const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,       // your Gmail
    pass: process.env.MAIL_PASS        // app-specific password
  }
});

exports.sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Your Verification Code",
    html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 10 minutes.</p>`
  };
  await transporter.sendMail(mailOptions);
};
