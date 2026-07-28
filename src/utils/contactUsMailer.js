import { sendEmail } from "./mailer";

const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Sends a thank you email to a user who submitted a Contact Us request.
 * @param {{ email: string; name: string }} payload
 */
export const sendContactUsThankYouEmail = async ({ email, name }) => {
  const subject = "Thank you for contacting CoopPilot!";
  const body = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting CoopPilot</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #fdf0ea;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #fceae2;
          }
          .header {
            background-color: #7c0a29;
            color: white;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 32px 24px;
          }
          .footer {
            font-size: 12px;
            color: #777;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #fef2ec;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0;">CoopPilot</h2>
          </div>
          <div class="content">
            <p>Dear ${escapeHtml(name)},</p>
            <p>Thank you for reaching out to CoopPilot. We have received your message and our team is currently reviewing it.</p>
            <p>We appreciate your interest in our digital cooperative management platform and will get back to you as soon as possible.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>The CoopPilot Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 CoopPilot. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    sender: process.env.MAIL_SENDER || "no-reply@cooppilot.org",
    recipient: email,
    subject,
    body
  });
};
