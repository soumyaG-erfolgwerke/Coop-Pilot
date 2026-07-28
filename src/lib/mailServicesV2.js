import { readJsonResponse } from "./orgAdminService";

export const mailSetup = async (accEmail, email, name) => {
    try {

        const mailData = {
            accEmail: accEmail,
            email: email,
            name: name,
        };

        const response = await fetch("/api/mailsV2/alias", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(mailData),
        });

        return await readJsonResponse(response);
    } catch (error) {
        console.error("Error in email:", error);
        throw error;
    }
};

export const getInbox = async (accEmail, page, limit) => {
    try {

        const response = await fetch("/api/mailsV2/inbox", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accEmail: accEmail,
                page: page,
                limit: limit,
            }),
        });

        return await readJsonResponse(response);
    } catch (error) {
        console.error("Error in mail:", error);
        throw error;
    }
}

export const sentMails = async (accEmail, subject, body, to, attachments = []) => {
    try {

        const response = await fetch("/api/mailsV2/sent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accEmail: accEmail,
                subject: subject,
                body: body,
                to: to,
                attachments: attachments,
            }),
        });

        return await readJsonResponse(response);
    } catch (error) {
        console.error("Error sending mail:", error);
        throw error;
    }
}

export const messageByUid = async (accEmail, uid, folder = 'INBOX') => {
    try {

        const response = await fetch(`/api/mailsV2/message/${uid}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accEmail: accEmail,
                folder: folder,
            }),
        });

        return await readJsonResponse(response);
    } catch (error) {
        console.error("Error getting message by uid:", error);
        throw error;
    }
}

export const getSentMails = async (accEmail, page, limit) => {
    try {
        const response = await fetch(`/api/mailsV2/sent?accEmail=${encodeURIComponent(accEmail)}&page=${page}&limit=${limit}`, {
            method: "GET",
        });

        return await readJsonResponse(response);
    } catch (error) {
        console.error("Error fetching sent mails:", error);
        throw error;
    }
}

export const isMailExist = async (accEmail) => {
    try {
        const response = await fetch("/api/mailsV2/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accEmail: accEmail
            }),
        });

        return await readJsonResponse(response);
    } catch (error) {
        console.error("Error checking mail:", error);
        throw error;
    }
}