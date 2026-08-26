import crypto from 'crypto';

function createSignature(email, otp, expiresAt, purpose) {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new Error('OTP_SECRET is not configured');

    const payload = `${email}|${otp}|${expiresAt}|${purpose}`;
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, code, token, purpose = 'registration' } = req.body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();
    const cleanPurpose = String(purpose || 'registration').trim();

    if (!cleanEmail || !cleanCode || !token) {
        return res.status(400).json({ error: 'Email, OTP code and verification token are required' });
    }

    try {
        const parts = String(token).split('.');
        if (parts.length !== 2) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        const expiresAt = Number(parts[0]);
        const providedSignature = parts[1];

        if (!Number.isFinite(expiresAt) || !providedSignature) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        if (Date.now() > expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        const expectedSignature = createSignature(cleanEmail, cleanCode, expiresAt, cleanPurpose);

        const providedBuffer = Buffer.from(providedSignature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (
            providedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
        ) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }

        return res.status(200).json({ success: true, message: 'OTP verified successfully!' });

    } catch (error) {
        console.error('VERIFY OTP ERROR:', error);
        return res.status(500).json({ error: error.message || 'Failed to verify OTP' });
    }
}
