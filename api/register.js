const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, phone, email } = req.body;

  if (!firstName || !lastName || !phone || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const { data: existing } = await supabase
    .from('registrations')
    .select('code')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجّل مسبقاً', code: existing.code });
  }

  const code = generateCode();

  const { error: dbError } = await supabase
    .from('registrations')
    .insert([{ first_name: firstName, last_name: lastName, phone, email, code }]);

  if (dbError) {
    console.error('Supabase error:', dbError);
    return res.status(500).json({ error: 'Database error: ' + dbError.message });
  }

  // Send notification to admin only (no domain needed)
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: ADMIN_EMAIL,
    subject: `تسجيل جديد - ${firstName} ${lastName}`,
    html: `
      <div dir="rtl" style="font-family:Arial;padding:20px;">
        <h2>تسجيل جديد في الفعالية</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;">الاسم</td><td style="padding:8px;border:1px solid #ddd;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;">البريد الإلكتروني</td><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;">رقم الهاتف</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;">رمز التسجيل</td><td style="padding:8px;border:1px solid #ddd;font-size:24px;font-weight:bold;color:#185fa5;letter-spacing:4px;">${code}</td></tr>
        </table>
      </div>
    `,
  });

  return res.status(200).json({ success: true, code });
};
