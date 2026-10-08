import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
    }

    // 1. Authenticate the user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create a regular client to verify the JWT
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create an admin client with service_role key to bypass RLS and perform deletion
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Resolve the corresponding user profile
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('id, role, auth_user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Reject ADMIN deletion
    if (userProfile.role === 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Account deletion is disabled for Administrator accounts.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Clean up / Prepare for deletion using RPC (ends sessions, adds audit log)
    const { error: rpcError } = await adminClient.rpc('prepare_user_deletion', {
      p_user_id: userProfile.id
    })
    
    // We expect an error if the user is not the one running it, but since we're using adminClient,
    // the auth.uid() inside the RPC will actually be null or different if we don't pass the JWT.
    // Wait, prepare_user_deletion uses SECURITY DEFINER and checks auth.uid().
    // If we call it with adminClient, auth.uid() is not the user's uid!
    // So we must call the RPC using the USER's client!
    const { error: userRpcError } = await userClient.rpc('prepare_user_deletion', {
      p_user_id: userProfile.id
    })

    if (userRpcError) {
      return new Response(JSON.stringify({ error: 'Failed to prepare account deletion', details: userRpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Delete the Auth user server-side
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Failed to delete Auth account', details: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Account deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
