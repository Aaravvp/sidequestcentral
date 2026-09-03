import nodemailer from 'nodemailer';
import crypto from 'crypto';

function createToken(email, otp, expiresAt, purpose) {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new Error('OTP_SECRET is not configured');

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
    const cleanPurpose = String(purpose || 'registration').trim();

    if (!cleanEmail) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Pulls from GMAIL_USER / GMAIL_PASS (your Vercel names) with fallback to EMAIL_USER / EMAIL_PASS
    const emailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const emailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        console.error('SEND OTP ERROR: Email credentials missing in environment variables');
        return res.status(500).json({
            error: 'Email server is not configured (missing GMAIL_USER/GMAIL_PASS). Contact the site admin.',
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    try {
        const token = createToken(cleanEmail, otp, expiresAt, cleanPurpose);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        await transporter.sendMail({
            from: `"SideQuestCentral" <${emailUser}>`,
            to: cleanEmail,
            subject: 'Your SideQuestCentral verification code',
            text: `Your SideQuestCentral verification code is ${otp}. This code expires in 5 minutes.`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px">
                    <h2>SideQuestCentral verification</h2>
                    <p>Hey ${cleanName || 'there'}!</p>
                    <p>Your verification code is:</p>
                    <p style="font-size:32px;font-weight:bold;letter-spacing:6px">${otp}</p>
                    <p>This code expires in 5 minutes.</p>
                </div>
            `,
        });

        return res.status(200).json({ success: true, token, expiresAt });

    } catch (error) {
        console.error('SEND OTP ERROR:', error);
        return res.status(500).json({ error: error.message || 'Failed to send verification email' });
    }
}
