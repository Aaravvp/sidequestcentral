import nodemailer from 'nodemailer';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_KEY)),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const formattedEmail = email.trim().toLowerCase();
  if (!formattedEmail.endsWith('christuniversity.in')) {
    return res.status(400).json({ error: 'Only @christuniversity.in email addresses are allowed.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await admin.firestore().collection('otps').doc(formattedEmail).set({
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: `"Sidequest Central" <${process.env.GMAIL_USER}>`,
      to: formattedEmail,
      subject: 'Your Verification Code',
      html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
