import nodemailer from "nodemailer";

export const sendInviteEmail = async (
  recipient,
  coopName,
  inviteLink,
  organizationName,
  directorName,
  regNumber,
) => {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join Easy Coop</title>
    </head>
    <body style="margin:0;padding:20px;background:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#333;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        
        <div style="background:#B7416E;padding:32px 24px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:28px;">Easy Coop</h1>
        </div>

        <div style="padding:32px 24px;">
        <h2 style="margin-top:0;color:#1f2937;">
            You're invited to join Easy Coop
        </h2>

        <p>
            Hello ${directorName},
        </p>

        <p>
            Your Cooperative <strong>${coopName}(GNR: ${regNumber})</strong>'s information has been added by <strong>${organizationName}</strong>
        </p>


        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin:32px 0;">
            <p style="margin-top:0;">
            Click the button below to accept your invitation and get started.
            </p>

            <a href="${inviteLink}"
            style="
                display:inline-block;
                background:#B7416E;
                color:#ffffff;
                text-decoration:none;
                padding:14px 28px;
                border-radius:8px;
                font-weight:600;
                margin-top:8px;
            ">
            Accept Invitation
            </a>
        </div>

        <p>
            If the button above doesn't work, copy and paste the following link into your browser:
        </p>

        <p style="word-break:break-all;">
            <a href="${inviteLink}" style="color:#B7416E;">
            ${inviteLink}
            </a>
        </p>

        <p style="margin-top:32px;">
            Best regards,<br />
            <strong>The Easy Coop Team</strong>
        </p>
        </div>

        <div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;">
        Questions? Contact us at
        <a href="mailto:support@easycoop.com" style="color:#B7416E;">
            support@easycoop.com
        </a>
        </div>

    </div>
    </body>
    </html>
`;
  const createTransporter = () => {
    return nodemailer.createTransport({
      service: "zohomail",
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });
  };

  const mailOptions = {
    from: `"Easy Coop" <${process.env.ADMIN_EMAIL}>`,
    to: recipient,
    subject: "Join Easy Coop",
    html: emailTemplate,
  };

  const transporter = createTransporter();
  const mailResponse = await transporter.sendMail(mailOptions);
  console.log("Email sent");
  return mailResponse;
};
