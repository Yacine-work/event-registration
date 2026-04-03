const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // Check if email already registered
  const { data: existing } = await supabase
    .from('registrations')
    .select('code')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجّل مسبقاً' });
  }

  const code = generateCode();

  const { error: dbError } = await supabase
    .from('registrations')
    .insert([{ first_name: firstName, last_name: lastName, phone, email, code }]);

  if (dbError) {
    console.error('Supabase error:', dbError);
    return res.status(500).json({ error: 'Database error: ' + dbError.message });
  }

  const { error: emailError } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'رمز تسجيلك في الفعالية السنوية ٢٠٢٥',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f2ee;font-family:Arial,sans-serif;direction:rtl;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:100%;">
                <tr>
                  <td style="background:#185fa5;padding:32px;text-align:center;">
                    <h1 style="color:#fff;font-size:22px;margin:0;font-weight:700;">الفعالية السنوية ٢٠٢٥</h1>
                    <p style="color:#b5d4f4;margin:8px 0 0;font-size:14px;">تأكيد التسجيل</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;">مرحباً ${firstName} ${lastName}،</p>
                    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px;">شكراً لتسجيلك في الفعالية السنوية. فيما يلي رمز تسجيلك الخاص:</p>
                    <div style="text-align:center;margin:0 0 28px;">
                      <div style="display:inline-block;background:#f4f2ee;border:2px solid #e5e7eb;border-radius:12px;padding:16px 36px;">
                        <p style="margin:0;font-size:11px;color:#9ca3af;margin-bottom:8px;">رمز التسجيل</p>
                        <p style="margin:0;font-size:36px;font-weight:700;color:#185fa5;letter-spacing:10px;font-family:monospace;">${code}</p>
                      </div>
                    </div>
                    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">⚠️ يرجى الاحتفاظ بهذا الرمز وإبرازه عند الحضور.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #f0ede8;text-align:center;">
                    <p style="font-size:12px;color:#9ca3af;margin:0;">هذا البريد مُرسل تلقائياً، يرجى عدم الرد عليه.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (emailError) {
    console.error('Resend error:', emailError);
    return res.status(500).json({ error: 'Email error: ' + emailError.message });
  }

  return res.status(200).json({ success: true, code });
};
