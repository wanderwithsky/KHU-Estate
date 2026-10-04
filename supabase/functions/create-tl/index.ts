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

    // 2. Verify Caller is SENIOR_TL or ADMIN
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role, id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'SENIOR_TL' && profile.role !== 'ADMIN')) {
      throw new Error('Forbidden: Only Senior Team Leaders or Admins can create Team Leaders')
    }

    // 3. Parse Request
    const body = await req.json()
    const { applicationId, fullName, email, mobile, address } = body

    let finalFullName = fullName
    let finalEmail = email
    let finalMobile = mobile
    let finalAddress = address
    let assignedStlId = profile.id
    let app = null;

    if (applicationId) {
      // 4. Fetch Application
      const { data: appData, error: appError } = await supabaseClient
        .from('associate_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (appError || !appData) throw new Error('Application not found')
      app = appData;
      if (app.role_applied_for && app.role_applied_for !== 'Team Leader') throw new Error('Application is not for a Team Leader role')
      
      finalFullName = app.full_name
      finalEmail = app.email
      finalMobile = app.phone
      finalAddress = app.city
      assignedStlId = profile.role === 'ADMIN' ? (app.assigned_stl_id || profile.id) : profile.id
    } else {
      if (!finalFullName || !finalEmail) {
        throw new Error('Missing required fields for direct creation')
      }
    }
    
    if (!assignedStlId) throw new Error('Missing Senior TL ID assignment')

    // First check if profile already exists for this email
    const { data: existingProfile } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('email', finalEmail)
      .maybeSingle()

    let targetProfileId = null;
    let userCode = null;
    let tempPassword = crypto.randomUUID().slice(0, 12) + "Khu1!";

    if (existingProfile) {
      // Case B/D: Profile already exists
      if (existingProfile.role !== 'TEAM_LEADER') {
        throw new Error(`Conflict: A user with this email exists as a ${existingProfile.role}. Role conversion is not permitted automatically.`);
      }
      
      targetProfileId = existingProfile.id;
      userCode = existingProfile.user_code;

      if (app && app.status === 'ACCOUNT_CREATED' && app.created_account_user_id === targetProfileId) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Account already created and linked successfully',
            userCode
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    } else {
      // Profile does not exist. Check Auth user (Case A/C)
      let authUserId = null;
      let isRecovery = false;

      // 6. Create Supabase Auth User
      const { data: newAuthUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
        email: finalEmail,
        password: tempPassword,
        email_confirm: true
      })

      if (createAuthError) {
          if (createAuthError.message.includes('already registered') || createAuthError.status === 422 || createAuthError.code === 'user_already_exists') {
              const { data: listData, error: listError } = await supabaseClient.auth.admin.listUsers();
              if (listError) throw new Error('Failed to retrieve existing auth user');
              
              const existingAuthUser = listData.users.find((u: any) => u.email === finalEmail);
              if (!existingAuthUser) {
                  throw new Error('Email registered but user cannot be found for reconciliation.');
              }
              
              const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(
                  existingAuthUser.id,
                  { password: tempPassword, email_confirm: true }
              );
              
              if (updateAuthError) throw new Error(`Failed to update existing auth account: ${updateAuthError.message}`);
              
              authUserId = existingAuthUser.id;
              isRecovery = true;
          } else {
              throw new Error(createAuthError.message)
          }
      } else {
          authUserId = newAuthUser.user.id;
      }

      // 7. Generate TL Code safely using RPC
      const { data: userCodeData, error: codeError } = await supabaseClient
        .rpc('generate_user_code', { role_type: 'TEAM_LEADER' })
        
      if (codeError) throw new Error(`Failed to generate user code: ${codeError.message}`)
      userCode = userCodeData

      // 8. Insert User Profile
      const { data: newProfile, error: insertProfileError } = await supabaseClient
        .from('user_profiles')
        .insert({
          auth_user_id: authUserId,
          user_code: userCode,
          role: 'TEAM_LEADER',
          full_name: finalFullName,
          email: finalEmail,
          mobile: finalMobile,
          address: finalAddress,
          joining_date: new Date().toISOString(),
          parent_user_id: assignedStlId, // STL is the parent
          senior_tl_id: assignedStlId,
          status: 'ACTIVE',
          must_change_password: true
        })
        .select('id').single()

      if (insertProfileError || !newProfile) {
        if (!isRecovery && authUserId) {
          await supabaseClient.auth.admin.deleteUser(authUserId)
        }
        throw new Error(insertProfileError?.message || 'Failed to create profile')
      }
      
      targetProfileId = newProfile.id;
    }

    // 9. Update Application Status (if applicable)
    if (applicationId && app && app.status !== 'ACCOUNT_CREATED') {
      await supabaseClient
        .from('associate_applications')
        .update({
          status: 'ACCOUNT_CREATED',
          approved_at: new Date().toISOString(),
          created_account_user_id: targetProfileId,
          reviewed_by: profile.id
        })
        .eq('id', applicationId)
        
      await supabaseClient.from('application_history').insert({
        application_id: applicationId,
        status: 'ACCOUNT_CREATED',
        actor_user_id: profile.id,
        notes: `Account created/linked directly. User code: ${userCode}`
      })
    }

    if (!existingProfile) {
      // 10. Create Audit Log
      await supabaseClient.from('audit_logs').insert({
        actor_user_id: profile.id,
        action: 'CREATED_TEAM_LEADER',
        module: 'USERS',
        new_value: { userCode, email: finalEmail, role: 'TEAM_LEADER', source: applicationId ? 'application' : 'direct' }
      })
      
      // 11. Create Email Log (for future integration)
      await supabaseClient.from('email_logs').insert({
        recipient_email: finalEmail,
        template_name: 'WELCOME_CREDENTIALS',
        status: 'PENDING',
        metadata: { role: 'TEAM_LEADER', userCode }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingProfile ? 'Account linked successfully' : 'Team Leader created successfully',
        tempPassword: existingProfile ? null : tempPassword,
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
