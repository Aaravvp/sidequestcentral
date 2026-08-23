const nodemailer = require("nodemailer");

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

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return json(res, 500, {
            error: "email server settings are missing"
        });
    }

    try {
        const {
            toEmail,
            toName,
            joinerHandle,
            joinerCampus,
            joinerEmail,
            questTitle
        } = req.body || {};

        const recipient = String(toEmail || "").trim().toLowerCase();

        if (!isChristEmail(recipient)) {
            return json(res, 400, {
                error: "invalid recipient email"
            });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: `"SideQuestCentral" <${process.env.GMAIL_USER}>`,
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

        return json(res, 200, {
            ok: true
        });

    } catch (error) {
        console.error("NOTIFY JOIN ERROR:", error);

        return json(res, 500, {
            error: "failed to send join notification"
        });
    }
};
