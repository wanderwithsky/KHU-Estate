import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  console.log('Fetching users from debug RPC...');
  const { data, error } = await supabase.rpc('debug_get_users');
  if (error) {
    console.error('RPC Error:', error);
    return;
  }
  
  if (data) {
    const stl = data.find(u => u.user_code === 'STL003');
    const tl = data.find(u => u.user_code === 'TL002');
    const priya = data.find(u => u.full_name && u.full_name.toLowerCase().includes('priya'));
    
    console.log('--- Akash Singh (STL003) ---');
    console.log(JSON.stringify(stl, null, 2));
    
    console.log('\n--- Rahul Kumar (TL002) ---');
    console.log(JSON.stringify(tl, null, 2));
    
    console.log('\n--- Priya ---');
    console.log(JSON.stringify(priya, null, 2));
    
    // Check all associates assigned to Rahul Kumar
    const rahulAssociates = data.filter(u => u.parent_user_id === tl?.id);
    console.log(`\nAssociates assigned to Rahul Kumar: ${rahulAssociates.length}`);
    console.log(JSON.stringify(rahulAssociates.map(a => a.full_name), null, 2));
    
    const priyaAssignedTL = data.find(u => u.id === priya?.parent_user_id);
    console.log(`\nPriya is assigned to TL: ${priyaAssignedTL?.full_name} (${priyaAssignedTL?.user_code})`);
  }
}

run();
