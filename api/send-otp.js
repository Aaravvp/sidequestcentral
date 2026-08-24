import nodemailer from 'nodemailer';

// Shared memory store for local/testing execution
global.otpStore = global.otpStore || {};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate 6-digit OTP and set 5-minute expiration
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  global.otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Authentication" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your One-Time Password',
      text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Verification Code</h2>
              <p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
              <p>This code will expire in 5 minutes.</p>
             </div>`,
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Mail Error:', error);
    return res.status(500).json({ error: 'Failed to send email standard message.' });
  }
}
