const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, whatsapp, bloodType } = req.body;

  if (!firstName || !lastName || !whatsapp || !bloodType) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if whatsapp already registered
  const { data: existing } = await supabase
    .from('registrations')
    .select('code')
    .eq('whatsapp', whatsapp)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'رقم الواتساب هذا مسجّل مسبقاً', code: existing.code });
  }

  const code = generateCode();

  const { error: dbError } = await supabase
    .from('registrations')
    .insert([{
      first_name: firstName,
      last_name: lastName,
      whatsapp,
      blood_type: bloodType,
      code
    }]);

  if (dbError) {
    console.error('Supabase error:', dbError);
    return res.status(500).json({ error: 'Database error: ' + dbError.message });
  }

  return res.status(200).json({ success: true, code });
};
