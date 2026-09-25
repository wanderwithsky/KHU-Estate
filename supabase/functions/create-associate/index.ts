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

    // 1. JWT verification
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) throw new Error('Unauthorized')

    // 2. Caller profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role, id, senior_tl_id, team_id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile) throw new Error('Profile not found')

    if (profile.role !== 'TEAM_LEADER' && profile.role !== 'ADMIN') {
      throw new Error('Forbidden: Only TLs and Admins can create Associates')
    }

    // 3. Parse request
    const { applicationId } = await req.json()
    if (!applicationId) throw new Error('Missing applicationId')

    // 4. Verify Application Ownership & Status
    const { data: application, error: applicationError } = await supabaseClient
      .from('associate_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (applicationError || !application) throw new Error('Application not found')
    
    // Only verify assigned_tl if it's a TEAM_LEADER doing the approval
    if (profile.role === 'TEAM_LEADER' && application.assigned_tl_id && application.assigned_tl_id !== profile.id) {
        throw new Error('Forbidden: Application not assigned to you')
    }

    if (application.status !== 'PENDING_TL_REVIEW' && application.status !== 'PENDING_STL_REVIEW' && application.status !== 'ACCOUNT_CREATION_PENDING') {
      throw new Error('Application is not in a valid state for account creation')
    }

    // 5. Generate secure temp password
    const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!"

    // 6. Create Auth Identity
    const { data: newAuthUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true
    })

    if (createAuthError) throw new Error(createAuthError.message)

    // 7. Generate Associate ID
    const { count } = await supabaseClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ASSOCIATE')

    const userCode = `ASSOC${String((count || 0) + 1).padStart(4, '0')}`
    
    // If ADMIN approves directly without TL, it remains unassigned. 
    // If TL approves, or Admin approves an assigned one, use the assigned_tl_id or TL's id.
    const tlParentId = application.assigned_tl_id || (profile.role === 'TEAM_LEADER' ? profile.id : null);
    
    // If TL parent exists, we ideally want their senior_tl_id. If application has it, use it. 
    const stlParentId = application.assigned_stl_id || (profile.role === 'TEAM_LEADER' ? profile.senior_tl_id : null);

    // 8. Create User Profile
    const { error: insertProfileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        auth_user_id: newAuthUser.user.id,
        user_code: userCode,
        role: 'ASSOCIATE',
        full_name: application.full_name,
        email: application.email,
        mobile: application.phone,
        city: application.city,
        parent_user_id: tlParentId,
        senior_tl_id: stlParentId,
        team_id: profile.role === 'TEAM_LEADER' ? profile.team_id : null,
        sponsor_id: application.sponsor_id || tlParentId,
        must_change_password: true,
        status: 'ACTIVE'
      })

    if (insertProfileError) {
      await supabaseClient.auth.admin.deleteUser(newAuthUser.user.id)
      throw new Error(insertProfileError.message)
    }

    // 9. Update Application Status
    await supabaseClient
      .from('associate_applications')
      .update({ 
        status: 'ACCOUNT_CREATED',
        created_account_user_id: profile.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      
    // 10. Write Application History
    await supabaseClient.from('application_history').insert({
        application_id: applicationId,
        actor_user_id: profile.id,
        action: 'ACCOUNT_CREATED',
        old_status: application.status,
        new_status: 'ACCOUNT_CREATED',
        comment: 'Associate account provisioned.'
    })
    
    // 11. Write Audit Log
    await supabaseClient.from('audit_logs').insert({
      actor_user_id: profile.id,
      action: 'CREATED_ASSOCIATE',
      module: 'USERS',
      new_value: { userCode, email: application.email, role: 'ASSOCIATE' }
    })

    // 12. Create Email Log (Stub for actual email sending logic)
    await supabaseClient.from('email_logs').insert({
        recipient_email: application.email,
        template_name: 'ASSOCIATE_WELCOME_CREDENTIALS',
        subject: 'Welcome to KHU Developers - Your Associate Credentials',
        status: 'QUEUED',
        metadata: { userCode, tempPassword }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account created successfully', 
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
