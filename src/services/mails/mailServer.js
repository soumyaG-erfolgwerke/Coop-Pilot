import {
    createAdminClient,
    DATABASE_ID,
    COLLECTION_ID_MAIL_DIRECTORY,
} from "@/lib/appwrite-server";

import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import { Query } from "node-appwrite";
import { decryptMailCredential } from "@/lib/mailCredentialCrypto";

async function getCredential(accEmail) {
    try {
        const { databases } = createAdminClient();

        const mailRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_MAIL_DIRECTORY,
            [
                Query.equal("accEmail", accEmail),
            ]
        );

        const credential = mailRes.documents[0];
        if (!credential) throw new Error("Mailbox credential not found");
        return {
            ...credential,
            password: decryptMailCredential(credential.password),
        };
    } catch (error) {
        console.error("Error getting mailboxes:", error);
        throw error;
    }
}

export async function sendMail(accEmail, subject, body, to, attachments = []) {
    try {
        const mailData = await getCredential(accEmail);

        //SMTP Delivery: Configure Nodemailer transporter with fetched credentials
        const transporter = nodemailer.createTransport({
            host: 'mail.erfolgwerke.cloud',
            port: 587,
            secure: false, // false for TLS/STARTTLS over port 587
            auth: {
                user: mailData.aliasEmail,
                pass: mailData.password,
            },
        });

        // Mailcow SMTP Server: Send the mail through Mailcow
        const mailOptions = {
            from: mailData.aliasEmail,
            cc: [mailData.email],
            to: to,
            subject: subject,
            text: body,
            attachments: attachments && attachments.length > 0
                ? attachments
                    .filter(att => att && typeof att.content === "string")
                    .map(att => ({
                        filename: att.filename,
                        contentType: att.contentType,
                        content: Buffer.from(att.content, "base64")
                    }))
                : []
        };

        const info = await transporter.sendMail(mailOptions);

        // Save a copy of the sent email in the IMAP "Sent" folder
        try {
            const mailComposer = new MailComposer(mailOptions);
            const messageBuffer = await mailComposer.compile().build();

            const imapClient = new ImapFlow({
                host: 'mail.erfolgwerke.cloud',
                port: 993,
                secure: true,
                auth: {
                    user: mailData.aliasEmail,
                    pass: mailData.password,
                },
                logger: false,
            });

            await imapClient.connect();
            try {
                await imapClient.append('Sent', messageBuffer, ['\\Seen']);
            } finally {
                await imapClient.logout();
            }
        } catch (imapErr) {
            console.error("Failed to append sent email to IMAP Sent folder:", imapErr);
        }

        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("Error sending mail:", error);
        throw error;
    }
}


export async function getInbox(accEmail, page, limit) {
    try {
        const mailData = await getCredential(accEmail);

        const client = new ImapFlow({
            host: 'mail.erfolgwerke.cloud',
            port: 993,
            secure: true,
            auth: {
                user: mailData.aliasEmail,
                pass: mailData.password,
            },
            logger: false,
        });

        await client.connect();
        let emails = [];
        let totalMessages = 0;

        try {
            let lock = await client.getMailboxLock('INBOX');
            try {
                totalMessages = client.mailbox.exists;
                if (totalMessages > 0) {
                    // Pagination logic: Fetch newest messages first
                    const start = Math.max(1, totalMessages - (page * limit) + 1);
                    const end = totalMessages - ((page - 1) * limit);

                    for await (let message of client.fetch(`${start}:${end}`, { envelope: true, flags: true })) {
                        const isRead = message.flags.has("\\Seen");
                        emails.push({
                            uid: message.uid,
                            seq: message.seq,
                            subject: message.envelope.subject,
                            from: message.envelope.from[0]?.address || "Unknown",
                            date: message.envelope.date,
                            flags: message.flags,
                            isRead: isRead,
                        });
                    }
                    emails.reverse(); // Newest email at index 0
                }
            } finally {
                lock.release();
            }
        } finally {
            await client.logout();
        }

        return { success: true, data: emails, total: totalMessages, page, limit };

    } catch (error) {
        console.error("Error getting inbox:", error);
        throw error;
    }
}

export async function getMessages(accEmail, uid, folder = 'INBOX') {
    try {

        const creds = await getCredential(accEmail);

        const client = new ImapFlow({
            host: "mail.erfolgwerke.cloud",
            port: 993,
            secure: true,
            auth: { user: creds.aliasEmail, pass: creds.password },
            logger: false
        });

        await client.connect();
        let lock = await client.getMailboxLock(folder);

        try {
            // Fetch specific raw MIME email
            const message = await client.fetchOne(uid, { source: true }, { uid: true });

            if (!message) {
                return { success: false, error: "Email not found" };
            }

            // Mark the email as Seen on the server (only if it is in the INBOX)
            if (folder === 'INBOX') {
                try {
                    await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
                } catch (flagErr) {
                    console.error("Failed to set Seen flag:", flagErr);
                }
            }

            // Parse stream using mailparser
            const parsed = await simpleParser(message.source);

            const mailData = {
                success: true,
                uid: uid,
                subject: parsed.subject,
                from: parsed.from?.text,
                to: parsed.to?.text,
                date: parsed.date,
                html: parsed.html || parsed.textAsHtml,
                text: parsed.text,
                attachments: parsed.attachments.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size,
                    content: att.content ? att.content.toString("base64") : null
                }))
            };

            return mailData;
        } finally {
            lock.release();
            await client.logout();
        }



    } catch (error) {
        console.error("Error getting message by uid:", error);
        throw error;
    }
}

export async function getSent(accEmail, page, limit) {
    try {
        const mailData = await getCredential(accEmail);

        const client = new ImapFlow({
            host: 'mail.erfolgwerke.cloud',
            port: 993,
            secure: true,
            auth: {
                user: mailData.aliasEmail,
                pass: mailData.password,
            },
            logger: false,
        });

        await client.connect();
        let emails = [];
        let totalMessages = 0;

        try {
            let lock = await client.getMailboxLock('Sent');
            try {
                totalMessages = client.mailbox.exists;
                if (totalMessages > 0) {
                    // Pagination logic: Fetch newest messages first
                    const start = Math.max(1, totalMessages - (page * limit) + 1);
                    const end = totalMessages - ((page - 1) * limit);

                    for await (let message of client.fetch(`${start}:${end}`, { envelope: true, flags: true })) {
                        emails.push({
                            uid: message.uid,
                            seq: message.seq,
                            subject: message.envelope.subject,
                            to: message.envelope.to
                                ? message.envelope.to.map((t) => `${t.name || ''} <${t.address}>`).join(", ")
                                : "Unknown",
                            date: message.envelope.date,
                            flags: message.flags,
                        });
                    }
                    emails.reverse(); // Newest email at index 0
                }
            } finally {
                lock.release();
            }
        } finally {
            await client.logout();
        }



        return { success: true, data: emails, total: totalMessages, page, limit };

    } catch (error) {
        console.error("Error getting sent box:", error);
        throw error;
    }
}
