import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, user_code, full_name, role, status')
    .eq('role', 'SENIOR_TL')
    .eq('status', 'ACTIVE')

  console.log('Error:', error)
  console.log('Data:', data)
}

test()
