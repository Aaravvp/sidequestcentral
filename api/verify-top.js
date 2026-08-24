export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = global.otpStore ? global.otpStore[email] : null;

  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    delete global.otpStore[email];
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  delete global.otpStore[email];
  return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
}
