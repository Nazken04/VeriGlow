// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,    // Should be smtp.gmail.com from .env
    port: process.env.EMAIL_PORT,    // Should be 465 from .env
    secure: true,                    // <--- Set to TRUE for port 465 (SSL)
                                     // If you decide to use port 587 later, this would be FALSE for STARTTLS
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      // This setting is sometimes needed in development to bypass certificate errors,
      // but ideally, for production, ensure valid certificates and remove this.
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `VeriGlow <${process.env.EMAIL_FROM}>`, // Sender email address
    to: options.email, // Recipient email address
    subject: options.subject, // Email subject
    html: options.message, // Email body in HTML
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;