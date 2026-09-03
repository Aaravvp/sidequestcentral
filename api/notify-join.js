const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// Initialize Firebase Admin (uses FIREBASE_SERVICE_KEY env variable in Vercel)
if (!admin.apps.length && process.env.FIREBASE_SERVICE_KEY) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (err) {
        console.error("Firebase Admin initialization error:", err);
    }
}

function json(res, status, body) {
    return res.status(status).json(body);
}

function isChristEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?christuniversity\.in$/i.test(
        String(email || "").trim()
    );
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return json(res, 405, { error: "method not allowed" });
    }

    const emailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const emailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        console.error("NOTIFY JOIN ERROR: GMAIL_USER / GMAIL_PASS env vars are missing");
        return json(res, 500, { error: "email server settings are missing" });
    }

    try {
        const {
            toEmail,
            toName,
            joinerHandle,
            joinerCampus,
            joinerEmail,
            questTitle,
            targetFcmToken // The quest host's Android device token
        } = req.body || {};

        const recipient = String(toEmail || "").trim().toLowerCase();

        if (!isChristEmail(recipient)) {
            return json(res, 400, { error: "invalid recipient email" });
        }

        // 1. SEND GMAIL NOTIFICATION
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        await transporter.sendMail({
            from: `"SideQuestCentral" <${emailUser}>`,
            to: recipient,
            subject: `Someone joined your quest — ${questTitle || "SideQuest"}`,
            text:
`Hey ${toName || "there"},

@${joinerHandle || "someone"} joined your quest "${questTitle || "your quest"}"!

Campus: ${joinerCampus || "N/A"}
Email: ${joinerEmail || "N/A"}

Open SideQuestCentral to see your quest and contact them.

— SideQuestCentral`
        });

        // 2. SEND ANDROID PUSH NOTIFICATION (If host has an FCM token)
        let pushSent = false;
        if (targetFcmToken && admin.apps.length) {
            try {
                await admin.messaging().send({
                    token: targetFcmToken,
                    notification: {
                        title: "Someone joined your quest! 🚀",
                        body: `@${joinerHandle || "Someone"} joined "${questTitle || "your quest"}"`
                    },
                    data: {
                        click_action: "OPEN_QUEST_DETAILS",
                        questTitle: String(questTitle || "")
                    }
                });
                pushSent = true;
            } catch (pushError) {
                console.error("FCM Push Error (Email was still sent):", pushError);
            }
        }

        return json(res, 200, {
            ok: true,
            emailSent: true,
            pushSent: pushSent
        });

    } catch (error) {
        console.error("NOTIFY JOIN ERROR:", error);
        return json(res, 500, { error: "failed to send join notification" });
    }
};
