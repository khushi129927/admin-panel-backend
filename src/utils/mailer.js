const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER, // your Hostinger email
    pass: process.env.MAIL_PASS  // your Hostinger email password
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
