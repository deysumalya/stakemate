const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  let url = '';
  let key = '';
  env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
  });

  const endpoint = `${url}/rest/v1/users?select=id,full_name,occupation,target_goal&limit=1`;
  const response = await fetch(endpoint, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
