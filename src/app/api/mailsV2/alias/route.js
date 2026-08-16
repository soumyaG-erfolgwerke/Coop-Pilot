import { NextResponse } from "next/server";
import { generate } from 'generate-password';
import {
    createAdminClient,
    DATABASE_ID,
    COLLECTION_ID_MAIL_DIRECTORY,
} from "@/lib/appwrite-server";
import { ID } from "node-appwrite";
import { encryptMailCredential } from "@/lib/mailCredentialCrypto";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function POST(request) {
    try {

        const body = await request.json();
        const { accEmail, email, name } = body;

        if (!accEmail || !email || !name) {
            return NextResponse.json(
                { success: false, error: "accEmail and email and name are required" },
                { status: 400 },
            );
        }

        //1. Creating alias and password

        const aliasName = email.split("@")[0] + "." + email.split("@")[1];
        const fullAlias = aliasName + "@" + "coop-os.de";
        const password = generate({
            length: 12,
            numbers: true,
            symbols: true,
            excludeSimilar: true,
            excludeSpaces: true,
            excludeAmbiguous: true,
            excludePunctuation: true,
            lowercase: true,
            uppercase: true,
        });

        //2. Creating alias mail in mail server

        const payload = {
            local_part: aliasName,
            domain: "coop-os.de",
            name: name,
            password: password,
            password2: password,
            quota: 1024,
            active: 1
        };

        const response = await fetch("https://mail.erfolgwerke.cloud/api/v1/add/mailbox", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.MAILCOW_API_KEY
            },
            body: JSON.stringify(payload)
        });

        const resText = await response.text();
        let mailData = null;
        if (resText.trim()) {
            try {
                mailData = JSON.parse(resText);
            } catch (e) {
                throw new Error(`Mailcow add/mailbox API error (Status ${response.status}): ${resText.substring(0, 200)}`);
            }
        } else if (response.status >= 200 && response.status < 300) {
            mailData = { type: "success", msg: "mailbox added" };
        } else {
            throw new Error(`Mailcow add/mailbox API error: Empty response with status ${response.status}`);
        }

        const hasMailboxError = Array.isArray(mailData)
            ? mailData.some(item => item.type === "error")
            : mailData?.type === "error";

        if (response.status !== 200 || hasMailboxError) {
            const errMsg = Array.isArray(mailData)
                ? mailData.map(m => m.msg || m.log?.join(", ") || JSON.stringify(m)).join(", ")
                : (mailData?.message || mailData?.msg || JSON.stringify(mailData));

            await fetch("https://mail.erfolgwerke.cloud/api/v1/delete/mailbox", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.MAILCOW_API_KEY
                },
                body: JSON.stringify([fullAlias])
            });

            return NextResponse.json(
                { success: false, error: `Failed to create alias mailbox: ${errMsg}` },
                { status: response.status === 200 ? 400 : response.status },
            );
        }

        //3. conect alias to original
        const aliasPayload = {
            address: fullAlias,             // The new custom alias address
            goto: [email, fullAlias],     // Your existing original mailbox
            active: 1,                                // 1 = Active, 0 = Disabled
            sogo_visible: 0,                          // Makes it visible in SOGo webmail
            sender_allowed: "1"                       // Allows your original mailbox to send outgoing mail AS this alias
        };

        const aliasResponse = await fetch("https://mail.erfolgwerke.cloud/api/v1/add/alias", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.MAILCOW_API_KEY
            },
            body: JSON.stringify(aliasPayload)
        });

        const aliasResText = await aliasResponse.text();
        let aliasData = null;
        if (aliasResText.trim()) {
            try {
                aliasData = JSON.parse(aliasResText);
            } catch (e) {
                throw new Error(`Mailcow add/alias API error (Status ${aliasResponse.status}): ${aliasResText.substring(0, 200)}`);
            }
        } else if (aliasResponse.status >= 200 && aliasResponse.status < 300) {
            aliasData = { type: "success", msg: "alias added" };
        } else {
            throw new Error(`Mailcow add/alias API error: Empty response with status ${aliasResponse.status}`);
        }

        const hasAliasError = Array.isArray(aliasData)
            ? aliasData.some(item => item.type === "error")
            : aliasData?.type === "error";

        if (aliasResponse.status !== 200 || hasAliasError) {
            const errMsg = Array.isArray(aliasData)
                ? aliasData.map(m => m.msg || m.log?.join(", ") || JSON.stringify(m)).join(", ")
                : (aliasData?.message || aliasData?.msg || JSON.stringify(aliasData));

            await fetch("https://mail.erfolgwerke.cloud/api/v1/delete/mailbox", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.MAILCOW_API_KEY
                },
                body: JSON.stringify([fullAlias])
            });

            return NextResponse.json(
                { success: false, error: `Failed to create alias: ${errMsg}` },
                { status: aliasResponse.status === 200 ? 400 : aliasResponse.status },
            );
        }

        const { databases } = createAdminClient();

        try {
            const mailRes = await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID_MAIL_DIRECTORY,
                ID.unique(),
                {
                    accEmail: accEmail,
                    email: email,
                    aliasEmail: fullAlias,
                    password: encryptMailCredential(password),
                    name: name,
                }
            );

            return NextResponse.json(
                { success: true, aliasEmail: fullAlias },
                { status: 200 }
            );
        }

        catch (dbError) {
            // delete the alias
            await fetch("https://mail.erfolgwerke.cloud/api/v1/delete/mailbox", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": process.env.MAILCOW_API_KEY
                },
                body: JSON.stringify([fullAlias])
            });

            throw dbError;
        }

    } catch (error) {
        return NextResponse.json(
            { success: false, error: safePublicError(error, "Failed to set mail up") },
            { status: 500 },
        );
    }
}

