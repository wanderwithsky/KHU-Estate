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
    const { applicationId, loginId, password } = await req.json()
    if (!applicationId) throw new Error('Missing applicationId')
    if (!loginId || !password) throw new Error('Missing loginId or password')

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
      if (application.status !== 'ACCOUNT_CREATED') {
        throw new Error('Application is not in a valid state for account creation')
      }
    }

    let existingProfile = null;
    if (application.created_account_user_id) {
        const { data: prof, error: profErr } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', application.created_account_user_id)
            .single();
        if (!profErr && prof) {
            existingProfile = prof;
        }
    }

    // 5. Create Auth Identity using the provided loginId
    // If loginId is not an email, we create a valid email format for Supabase Auth
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
    
    const tlParentId = application.assigned_tl_id || (profile.role === 'TEAM_LEADER' ? profile.id : null);
    const stlParentId = application.assigned_stl_id || (profile.role === 'TEAM_LEADER' ? profile.senior_tl_id : null);

    // 6. Create or Link User Profile
    let targetProfileId = null;

    if (existingProfile) {
        const { error: updateProfileError } = await supabaseClient
            .from('user_profiles')
            .update({ 
                auth_user_id: authUserId, 
                user_code: userCode, 
                must_change_password: true,
                role: 'ASSOCIATE',
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
    

    // 9. Update Application Status
    if (application.status !== 'ACCOUNT_CREATED') {
      await supabaseClient
        .from('associate_applications')
        .update({ 
          status: 'ACCOUNT_CREATED',
          created_account_user_id: targetProfileId,
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
    }

    // 11. Write Audit Log
    await supabaseClient.from('audit_logs').insert({
      actor_user_id: profile.id,
      action: 'CREATED_ASSOCIATE',
      module: 'USERS',
      new_value: { userCode, email: application.email, role: 'ASSOCIATE' }
    })

    // 12. Create Email Log 
    if (application.email) {
      await supabaseClient.from('email_logs').insert({
          recipient_email: application.email,
          template_name: 'ASSOCIATE_WELCOME_CREDENTIALS',
          subject: 'Welcome to KHU Developers - Your Associate Credentials',
          status: 'QUEUED',
          metadata: { userCode, tempPassword }
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingProfile ? 'Account linked successfully' : 'Account created successfully', 
        userId: authUserId,
        userCode: userCode,
        email: application.email,
        temporaryPassword: tempPassword,
        role: 'ASSOCIATE',
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
