import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_MAILS, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { sendEmail } from "@/utils/mailer";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

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
    const session = await resolveSession();
    const mailData = await request.json();
    
    const {
      recipientId,
      recipientRole,
      subject,
      body,
    } = mailData;


    if (!recipientId || !subject || !body || subject.length > 200 || body.length > 20000) {
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


    const { databases } = createAdminClient();
    const recipientResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", recipientId), Query.limit(1)],
    );
    const recipientProfile = recipientResult.documents[0];
    if (!recipientProfile) {
      return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 });
    }

    const senderEmail = session.email;
    const senderName = session.profile?.name || session.account?.name || senderEmail;
    const recipientEmail = recipientProfile.contactEmail || recipientProfile.email;
    const recipientName = recipientProfile.name || recipientEmail;
    if (!senderEmail || !recipientEmail) {
      return NextResponse.json({ success: false, error: "Mail identity is unavailable" }, { status: 400 });
    }

    const sender = { name: senderName, email: senderEmail, id: session.userId };
    const recipient = { name: recipientName, email: recipientEmail, id: recipientId, role: recipientProfile.role };
    const mailResponse = await sendEmail({ sender, recipient, subject, body });

    const record = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_MAILS,
      ID.unique(),
      {
        senderId: session.userId,
        senderEmail,
        recipientId,
        recipientEmail,
        senderName,
        recipientName,
        subject,
        body,
        role: recipientProfile.role || recipientRole || "member",
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      record,
      mailResponse,
    });
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) return sessionErrorResponse(err);
    console.error("Mail Service Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send mail", context: err },
      { status: 500 }
    );
  }
}
