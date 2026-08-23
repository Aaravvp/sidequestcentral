import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_KEY)),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

  try {
    const docRef = admin.firestore().collection('otps').doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(400).json({ error: 'No verification code found. Request a new one.' });
    }

    const data = doc.data();

    // Check if expired
    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    }

    // Check if code matches
    if (data.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Clean up used OTP
    await docRef.delete();

    return res.status(200).json({ success: true, message: 'Verified successfully!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
