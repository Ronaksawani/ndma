require("dotenv").config();
const nodemailer = require("nodemailer");

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

async function main() {
  if (!gmailUser) {
    console.error("Missing Gmail user. Set GMAIL_USER in server/.env");
    process.exit(1);
  }

  if (!gmailPass) {
    console.error(
      "Missing Gmail app password. Set GMAIL_PASS (or GAMIL_PASS) in server/.env",
    );
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully.");

    const info = await transporter.sendMail({
      from: `"NDMA Team" <${gmailUser}>`,
      to: gmailUser,
      subject: "NDMA Nodemailer Gmail test",
      text: "This is a test email from the NDMA server try.js script.",
      html: "<p>This is a test email from the NDMA server <strong>try.js</strong> script.</p>",
    });

    console.log("Test email sent successfully.");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
  } catch (error) {
    console.error("Failed to verify or send mail.");
    console.error(error);
    process.exitCode = 1;
  }
}

main();
