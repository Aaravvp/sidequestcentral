import nodemailer from 'nodemailer';
import crypto from 'crypto';

function createToken(email, otp, expiresAt, purpose) {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error('OTP_SECRET is not configured');
    }

    const payload = `${email}|${otp}|${expiresAt}|${purpose}`;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return `${expiresAt}.${signature}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, name, purpose = 'registration' } = req.body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();

    if (!cleanEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    try {
        const token = createToken(
            cleanEmail,
            otp,
            expiresAt,
            purpose
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"SideQuestCentral" <${process.env.EMAIL_USER}>`,
            to: cleanEmail,
            subject: 'Your SideQuestCentral verification code',
            text: `Your SideQuestCentral verification code is ${otp}. This code expires in 5 minutes.`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px">
                    <h2>SideQuestCentral verification</h2>
                    <p>Hey ${cleanName || 'there'}!</p>
                    <p>Your verification code is:</p>
                    <p style="font-size:32px;font-weight:bold;letter-spacing:6px">
                        ${otp}
                    </p>
                    <p>This code expires in 5 minutes.</p>
                </div>
            `,
        });

        return res.status(200).json({
            success: true,
            token,
            expiresAt
        });

    } catch (error) {
        console.error('SEND OTP ERROR:', error);

        return res.status(500).json({
            error: error.message || 'Failed to send verification email'
        });
    }
}
