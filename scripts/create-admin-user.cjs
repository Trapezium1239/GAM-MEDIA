const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [, , email, password, role = 'admin', fullName = 'Admin User'] = process.argv;
if (!email || !password) {
  console.error('Usage: node scripts/create-admin-user.cjs <email> <password> [admin|media|pastor] [full name]');
  process.exit(1);
}
if (!['admin', 'media', 'pastor'].includes(role)) {
  console.error('Role must be one of: admin, media, pastor');
  process.exit(1);
}

(async () => {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError) {
    console.error('Create user failed:', createError.message);
    process.exit(1);
  }
  const userId = created.user.id;
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName, role }, { onConflict: 'id' });
  if (profileError) {
    console.error('Profile upsert failed:', profileError.message);
    process.exit(1);
  }
  console.log('Created user:', userId, email, 'role:', role);
})();
