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
    const body = await req.json()
    const { applicationId, fullName, email, mobile, address, loginId, password } = body

    let finalFullName = fullName
    let finalEmail = email
    let finalMobile = mobile
    let finalAddress = address
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
      if (app.role_applied_for && app.role_applied_for !== 'Senior Team Leader') throw new Error('Application is not for a Senior Team Leader role')

      finalFullName = app.full_name
      finalEmail = app.email
      finalMobile = app.phone
      finalAddress = app.city
    } else {
      if (!finalFullName || !finalEmail) {
        throw new Error('Missing required fields for direct creation')
      }
    }

    if (!loginId || !password) {
      throw new Error('Missing loginId or password')
    }

    let existingProfile = null;
    if (app && app.created_account_user_id) {
        const { data: prof, error: profErr } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', app.created_account_user_id)
            .single();
        if (!profErr && prof) {
            existingProfile = prof;
        }
    }

    // 5. Create Auth Identity using the provided loginId
    const loginString = loginId.trim();
    const authEmail = `${crypto.randomUUID()}@khu-internal.local`;
    const tempPassword = password;
    
    const { data: newAuthUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: true
    })

    if (createAuthError) {
      if (createAuthError.message.includes('already registered')) {
         throw new Error('That Login ID / Username is already taken. Please choose another one.');
      }
      throw new Error(`Failed to create Auth account: ${createAuthError.message}`)
    }

    const authUserId = newAuthUser.user.id;
    const userCode = loginString;

    // 6. Create or Link User Profile
    let targetProfileId = null;

    if (existingProfile) {
        const { error: updateProfileError } = await supabaseClient
            .from('user_profiles')
            .update({ 
                auth_user_id: authUserId, 
                user_code: userCode, 
                must_change_password: true,
                role: 'SENIOR_TL',
                status: 'ACTIVE'
            })
            .eq('id', existingProfile.id);

        if (updateProfileError) {
            await supabaseClient.auth.admin.deleteUser(authUserId);
            if (updateProfileError?.message?.includes('duplicate key value violates unique constraint')) {
                throw new Error('That Login ID / Username is already taken by another account.');
            }
            throw new Error(updateProfileError?.message || 'Failed to link profile');
        }
        targetProfileId = existingProfile.id;
    } else {
        const { data: newProfile, error: insertProfileError } = await supabaseClient
          .from('user_profiles')
          .insert({
            auth_user_id: authUserId,
            user_code: userCode,
            role: 'SENIOR_TL',
            full_name: finalFullName,
            email: finalEmail,
            mobile: finalMobile,
            address: finalAddress,
            joining_date: new Date().toISOString(),
            parent_user_id: profile.id, // Admin is the parent
            status: 'ACTIVE',
            must_change_password: true
          })
          .select('id').single()

        if (insertProfileError || !newProfile) {
          await supabaseClient.auth.admin.deleteUser(authUserId)
          if (insertProfileError?.message?.includes('duplicate key value violates unique constraint')) {
              throw new Error('That Login ID / Username is already taken by another account.');
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
        action: 'ACCOUNT_CREATED',
        new_status: 'ACCOUNT_CREATED',
        actor_user_id: profile.id,
        comment: `Account created/linked directly. User code: ${userCode}`
      })
    }

    // 10. Create Audit Log
    await supabaseClient.from('audit_logs').insert({
      actor_user_id: profile.id,
      action: 'CREATED_SENIOR_TL',
      module: 'USERS',
      new_value: { userCode, email: finalEmail, role: 'SENIOR_TL', source: applicationId ? 'application' : 'direct' }
    })
    
    // 11. Create Email Log (for future integration)
    if (finalEmail) {
      await supabaseClient.from('email_logs').insert({
        recipient_email: finalEmail,
        template_name: 'WELCOME_CREDENTIALS',
        subject: 'Welcome to KHU Developers',
        status: 'QUEUED',
        metadata: { role: 'SENIOR_TL', userCode }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingProfile ? 'Account linked successfully' : 'Senior Team Leader created successfully',
        userId: authUserId,
        userCode: userCode,
        email: finalEmail,
        temporaryPassword: tempPassword,
        role: 'SENIOR_TL',
        mustChangePassword: true
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
