const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('users')
    .update({ pledged_balance: 0 })
    .lt('pledged_balance', 0)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Fixed users:', data);
  }
}
main();
