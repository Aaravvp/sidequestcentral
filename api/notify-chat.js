const admin = require("firebase-admin");

// Initialize Firebase Admin using your Vercel FIREBASE_SERVICE_KEY
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

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const {
        recipientFcmToken,
        senderHandle,
        messageText,
        chatId
    } = req.body || {};

    if (!recipientFcmToken) {
        return res.status(400).json({ error: "Missing recipient FCM token" });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: "Firebase Admin is not configured on server" });
    }

    try {
        await admin.messaging().send({
            token: recipientFcmToken,
            notification: {
                title: `@${senderHandle || "New Message"}`,
                body: messageText ? (messageText.length > 80 ? messageText.substring(0, 77) + "..." : messageText) : "Sent you a message"
            },
            data: {
                click_action: "OPEN_CHAT",
                chatId: String(chatId || "")
            }
        });

        return res.status(200).json({ ok: true, pushSent: true });

    } catch (error) {
        console.error("CHAT NOTIFICATION ERROR:", error);
        return res.status(500).json({ error: "Failed to send chat push notification" });
    }
};
