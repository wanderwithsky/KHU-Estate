import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const envFile = readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/["']/g, '').trim();
});
const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);
async function run() {
  const { data, error } = await supabase.from('commissions').select('*, user_profiles!user_id(full_name, user_code)').limit(1);
  console.log("With !user_id:", JSON.stringify(data, null, 2), error);
  const { data: data2, error: error2 } = await supabase.from('commissions').select('*, user_profiles(full_name, user_code)').limit(1);
  console.log("With just user_profiles:", JSON.stringify(data2, null, 2), error2);
  const { data: data3, error: error3 } = await supabase.from('commissions').select('*, user_profiles:user_id(full_name, user_code)').limit(1);
  console.log("With :user_id", JSON.stringify(data3, null, 2), error3);
}
run();
