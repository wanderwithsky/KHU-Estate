import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  console.log('Fetching commissions...');
  const { data, error } = await supabase.rpc('debug_get_commissions');
  if (error) {
    console.error('Error fetching commissions:', error);
  } else {
    if (data) {
      console.log(`Found ${data.length} commissions.`);
      console.log(JSON.stringify(data.slice(0, 3), null, 2));
    } else {
      console.log('No commissions found.');
    }
  }
}

run();
