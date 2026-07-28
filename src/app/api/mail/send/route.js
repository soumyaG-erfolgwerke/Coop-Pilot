import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_MAILS } from "@/lib/appwrite-server";
import { sendEmail } from "@/utils/mailer";

// import Mailgun from "mailgun.js";
// import FormData from "form-data";

// // Initialize Mailgun Client (server-side only)
// const mailgun = new Mailgun(FormData);
// const mg = mailgun.client({
//   username: "api",
//   key: process.env.MAILGUN_API_KEY,
// });
// const domain = process.env.MAILGUN_DOMAIN;

// POST /api/mail/send - Send mail via Mailgun and save to database
export async function POST(request) {
  try {
    
    const mailData = await request.json();
    
    const {
      senderId,
      senderName,
      senderEmail,
      recipientId,
      recipientEmail,
      recipientName,
      recipientRole,
      subject,
      body,
    } = mailData;


    if (!senderId || !recipientId || !subject || !body) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // // A. Send via Mailgun (The "Real" Email)
    // let mailgunResponse = null;
    // if (process.env.MAILGUN_API_KEY) {
    //   const msgData = {
    //     //from : `${senderName} <${senderEmail}>`, // Optional: Show sender name in email
    //     from: "Easy Coop <no-relpy@easy-coop.de>",
    //     to: [recipientEmail],
    //     subject: subject,
    //     text: `You have a mail on easy coop from ${senderName},(${senderEmail}) \n ${body}`,
    //   };
    //   mailgunResponse = await mg.messages.create(domain, msgData);
    // } else {
    //   console.warn("mail api error.");
    // }

    // // //* future lettermint implementation now commented
    // // const options = {
    // //   method: 'POST',
    // //   headers: {'x-lettermint-token': process.env.LETTERMINT_API_KEY, 'Content-Type': 'application/json'},
    // //   body: JSON.stringify({
    // //     from: 'Easy Coop <no-relpy@easy-coop.de>',
    // //     subject: subject,
    // //     to: [recipientEmail],
    // //     ////route: '<string>',
    // //     tag: 'work-connection',
    // //     ////html: '<string>',
    // //     text: body,
    // //     ////cc: ['<string>'],
    // //     ////bcc: ['<string>'],
    // //     reply_to: [senderEmail],
    // //     ////headers: {'X-Custom-Header': 'custom-value', 'X-Campaign-ID': '12345'},
    // //     ////metadata: {user_id: '123', campaign_id: 'welcome-2025'},
    // //     ////attachments: [{filename: '<string>', content: '<string>', content_id: '<string>'}]
    // //   })
    // // };

    // //     const lettermintRes = await fetch('https://api.lettermint.co/v1/send', options);
    // //     const data = await lettermintRes.json();
    // //     console.log(data);


    //* nodemailer implementation
      const sender = { name: senderName, email: senderEmail, id: senderId };
      const recipient = { name: recipientName, email: recipientEmail, id: recipientId, role: recipientRole };
      const mailResponse = sendEmail({ sender, recipient, subject, body });
      

    // B. Save to Appwrite Database (The "System Record")
    const { databases } = createAdminClient();

    const record = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_MAILS,
      ID.unique(),
      {
        senderId,
        senderEmail,
        recipientId,
        recipientEmail,
        senderName,
        recipientName,
        subject,
        body,
        role: recipientRole,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      record,
      mailResponse,
    });
  } catch (err) {
    console.error("Mail Service Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send mail", context: err },
      { status: 500 }
    );
  }
}
