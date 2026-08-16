      const nodemailer = require("nodemailer");

      export const sendEmail = async ({ sender, recipient , subject, body}) => {
      try {

      const baseUrl = "https://easy-coop.de/";
      const loginLink = "https://easy-coop.de/signinpage";
      const dashboardLink = "https://easy-coop.de/dashboard";


      const mailBody = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notification - Easy Coop</title>
            <style>
            body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  margin: 0;
                  padding: 20px;
                  background-color: #f4f7fa;
                  color: #333;
            }

            .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                  overflow: hidden;
            }

            .header {
                  background-color: #B7416E; /* Logo background */
                  color: white;
                  padding: 24px;
                  text-align: center;
            }

            .logo {
                  font-size: 24px;
                  font-weight: bold;
                  letter-spacing: 0.5px;
            }

            .content {
                  padding: 32px 24px;
            }

            .message-box {
                  background-color: #f8fafc;
                  border-left: 4px solid #a2185b; /* Left side bar */
                  padding: 16px;
                  margin: 20px 0;
                  border-radius: 4px;
            }

            .btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #d17697; /* Button background */
                  color: white !important;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  margin-top: 20px;
                  text-align: center;
            }

            .btn:hover {
                  background-color: #B7416E; /* Hover state (using logo color for consistency) */
            }

            .footer {
                  background-color: #f1f5f9;
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #64748b;
                  border-top: 1px solid #e2e8f0;
            }
            
            h2 {
                  color: #0f172a;
                  margin-top: 0;
            }

            p {
                  margin-bottom: 16px;
            }
            </style>
            </head>

            <body>
            <div class="container">
                  <div class="header">
                        <div class="logo">Easy Coop</div>
                  </div>

                  <div class="content">
                        <h2>Hello ${recipient.name || 'User'},</h2>

                        <p>You have received a new notification regarding your cooperative activity.</p>

                        <div class="message-box">
                              <strong>Subject:</strong> ${subject}<br><br>
                              ${body}
                        </div>

                        <p>To view more details or take action, please log in to your dashboard.</p>

                        <div style="text-align: center;">
                              <a href="${dashboardLink}" class="btn">Go to Dashboard</a>
                              
                              <p style="margin-top: 15px; font-size: 14px;">
                                    Not logged in? <a href="${loginLink}" style="color: #0ea5e9; text-decoration: underline;">Login here</a>
                              </p>
                        </div>
                  </div>

                  <div class="footer">
                        <p>This is an automated message from Easy Coop platform. Please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} Easy Coop. All rights reserved.</p>
                        <p><a href="${baseUrl}" style="color: #64748b; text-decoration: underline;">Visit Website</a></p>
                  </div>
            </div>
            </body>
            </html> `;


      const createTransporter = () => {
            return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            requireTLS: process.env.SMTP_SECURE !== "true",
            auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASS,
            },
            tls: { minVersion: "TLSv1.2", servername: process.env.SMTP_HOST },
            });
      };

      const mailOptions = {
            from: `"Easy Coop" <${process.env.ADMIN_EMAIL}>`,
            to: recipient.email,
            subject: subject,
            html: mailBody,
      };

            const transporter = createTransporter();
            const mailResponse = await transporter.sendMail(mailOptions);
            console.log("Email sent");
            return mailResponse;

      } catch (error) {
      console.error("Email sending error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
      }
};
