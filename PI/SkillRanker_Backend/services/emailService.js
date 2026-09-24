const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "fedimbarekabidi@gmail.com",
        pass: "xwjjlsgeqstmlveh" // App Password
      },
      tls: {
        rejectUnauthorized: false // 🔥 FIX SSL ERROR
      }
    });

    const htmlContent = `
    <div style="max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px;font-family:Arial">
      <h2 style="color:#2F80EC;">📧 ${subject}</h2>
      <p style="font-size:14px;color:#333;white-space:pre-line;">${body}</p>
      <img src="https://rdsimages.cookieless.ca/polopoly_fs/1.9601811.1611006971!/img/httpImage/image.jpg_gen/derivatives/main-xxxhdpi/image.jpg"
      style="width:100%;margin-top:20px;border-radius:8px;" />
      <p style="font-size:12px;color:#888;margin-top:30px;">– Engineer Ds | Skillranker</p>
    </div>
    `;

    await transporter.sendMail({
      from: "Skillranker <fedimbarekabidi@gmail.com>",
      to,
      subject,
      html: htmlContent
    });

    console.log("✅ Email sent successfully");

  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};

module.exports = sendEmail;