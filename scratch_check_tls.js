import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL='))?.split('=')[1];
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('user_profiles').select('id, user_code, full_name, role, status').eq('role', 'TEAM_LEADER');
  console.log(JSON.stringify(data, null, 2));
}

check();
