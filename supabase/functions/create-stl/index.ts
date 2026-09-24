import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) throw new Error('Unauthorized')

    // 2. Verify Caller is ADMIN
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'ADMIN') {
      throw new Error('Forbidden: Only ADMIN can create Senior Team Leaders')
    }

    // 3. Parse Request
    const { fullName, email, mobile, address, joiningDate } = await req.json()
    if (!fullName || !email) throw new Error('Missing required fields')

    // 4. Generate Temporary Password
    const tempPassword = crypto.randomUUID().slice(0, 12) + "Khu1!"

    // 5. Create Supabase Auth User
    const { data: newAuthUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true
    })

    if (createAuthError) throw new Error(createAuthError.message)

    // 6. Generate STL Code (e.g. STL001)
    // Note: In production, use the Postgres sequence. 
    // For this prototype we will count existing STLs and increment.
    const { count } = await supabaseClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'SENIOR_TL')
    
    const userCode = `STL${String((count || 0) + 1).padStart(3, '0')}`

    // 7. Insert User Profile
    const { error: insertProfileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        auth_user_id: newAuthUser.user.id,
        user_code: userCode,
        role: 'SENIOR_TL',
        full_name: fullName,
        email: email,
        mobile: mobile,
        address: address,
        joining_date: joiningDate || new Date().toISOString(),
        parent_user_id: profile.id, // Admin is the parent
        status: 'ACTIVE',
        must_change_password: true
      })

    if (insertProfileError) {
      await supabaseClient.auth.admin.deleteUser(newAuthUser.user.id)
      throw new Error(insertProfileError.message)
    }

    // 8. Create Audit Log
    await supabaseClient.from('audit_logs').insert({
      actor_user_id: profile.id,
      action: 'CREATED_SENIOR_TL',
      module: 'USERS',
      new_value: { userCode, email, role: 'SENIOR_TL' }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senior Team Leader created successfully',
        tempPassword,
        userCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
