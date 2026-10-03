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

    // 1. Parse Request
    const body = await req.json()
    const { name, phone, email, project, message } = body

    if (!name || !phone) {
      throw new Error('Name and phone number are required')
    }

    // 2. Generate Lead Number (LD-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const randomHex = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0')
    const leadNumber = `LD-${dateStr}-${randomHex}`

    // 3. Resolve project_id if possible
    let projectId = null;
    if (project && project !== 'general') {
      // Find project ID from slug or name if needed, here we'll just store the text in notes if we can't find it, or we could look it up.
      // Since project is passed as string like "maa-kundwasini-nagar"
      const { data: projectData } = await supabaseClient
        .from('projects')
        .select('id')
        .ilike('slug', project)
        .maybeSingle()
      
      if (projectData) {
        projectId = projectData.id;
      }
    }

    // 4. Create Lead
    const leadData = {
      lead_number: leadNumber,
      name,
      phone,
      email: email || null,
      source: 'WEBSITE_CONTACT_FORM',
      status: 'NEW',
      project_id: projectId,
      notes: `Project Interest: ${project || 'None'}\n\nMessage: ${message || 'No message provided.'}`
    }

    const { error: insertError } = await supabaseClient
      .from('leads')
      .insert(leadData)

    if (insertError) {
      throw new Error(`Failed to save lead: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
