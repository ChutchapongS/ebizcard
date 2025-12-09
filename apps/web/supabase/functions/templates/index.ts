import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser, getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient()
    const url = new URL(req.url)
    const action = url.searchParams.get('action') // 'usage' or template ID
    const templateId = url.searchParams.get('id') || action // Support both 'id' and 'action' params
    
    // Handle /templates?action=usage endpoint
    if (action === 'usage') {
      if (req.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Authenticate user
      const { user, error: authError } = await authenticateUser(req)
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', details: authError || 'Invalid token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const body = await req.json().catch(() => null)
      const { template_id, card_id } = body || {}

      if (!template_id || !card_id) {
        return new Response(
          JSON.stringify({ error: 'template_id and card_id are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Record template usage
      const { data, error } = await supabase
        .from('template_usage')
        .insert({
          template_id,
          card_id,
          user_id: user.id,
          used_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error recording template usage:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to record template usage', details: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle /templates?id=<templateId> endpoint
    if (templateId && templateId !== 'usage') {
      // Authenticate user for PUT/DELETE
      if (req.method === 'PUT' || req.method === 'DELETE') {
        const { user, error: authError } = await authenticateUser(req)
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized', details: authError || 'Invalid token' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if user owns the template or is admin
        const { data: template } = await supabase
          .from('templates')
          .select('user_id, user_type')
          .eq('id', templateId)
          .single()

        if (!template) {
          return new Response(
            JSON.stringify({ error: 'Template not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        const currentUserType = profile?.user_type || 'user'
        const isAdmin = currentUserType === 'admin' || currentUserType === 'owner'
        const isOwner = template.user_id === user.id
        const templateUserType = template.user_type || 'user'
        const isTemplateSystem = templateUserType === 'admin' || templateUserType === 'owner'

        // Allow if:
        // 1. User is admin/owner AND template is system template (admin/owner created)
        // 2. User owns the template (template.user_id === user.id)
        if (!isAdmin && !isOwner) {
          return new Response(
            JSON.stringify({ error: 'Forbidden', details: 'Cannot modify this template' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Additional check: Only admin/owner can modify system templates
        if (isTemplateSystem && !isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Forbidden', details: 'Only admin/owner can modify system templates' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        if (req.method === 'PUT') {
          try {
            const body = await req.json().catch((err) => {
              console.error('Error parsing request body:', err)
              return null
            })
            
            if (!body || typeof body !== 'object') {
              return new Response(
                JSON.stringify({ error: 'Invalid request body' }),
                { 
                  status: 400, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }

            // Map request body to database schema
            const updateData: any = {
              updated_at: new Date().toISOString()
            }

            // Map fields from request to database columns
            if (body.name !== undefined) {
              updateData.name = body.name
            }
            if (body.paper !== undefined) {
              updateData.paper_settings = body.paper
              // Also update theme if background type is specified
              if (body.paper?.background?.type) {
                updateData.theme = body.paper.background.type
              }
            }
            if (body.elements !== undefined) {
              updateData.elements = body.elements
            }
            if (body.preview_image !== undefined) {
              updateData.preview_url = body.preview_image
            }

            console.log('Updating template:', {
              templateId,
              userId: user.id,
              userType: profile?.user_type,
              templateUserType: template.user_type,
              updateDataKeys: Object.keys(updateData),
              hasName: !!updateData.name,
              hasPaper: !!updateData.paper_settings,
              hasElements: !!updateData.elements,
              hasPreview: !!updateData.preview_url
            })

            // Use service role client (already set via getSupabaseClient) to bypass RLS
            const { data: updated, error: updateError } = await supabase
              .from('templates')
              .update(updateData)
              .eq('id', templateId)
              .select()
              .single()

            if (updateError) {
              console.error('Error updating template:', {
                error: updateError,
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint,
                code: updateError.code,
                templateId,
                userId: user.id,
                userType: profile?.user_type,
                templateUserType: template.user_type,
                templateUserId: template.user_id,
                updateDataKeys: Object.keys(updateData),
                updateData: {
                  name: updateData.name,
                  hasPaper: !!updateData.paper_settings,
                  hasElements: !!updateData.elements,
                  hasPreview: !!updateData.preview_url
                }
              })
              
              return new Response(
                JSON.stringify({ 
                  error: 'Failed to update template', 
                  details: updateError.message || 'Unknown error',
                  hint: updateError.hint,
                  code: updateError.code
                }),
                { 
                  status: 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }

            console.log('Template updated successfully:', {
              templateId,
              updatedName: updated?.name
            })

            return new Response(
              JSON.stringify({ data: updated }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          } catch (error) {
            console.error('Unexpected error in PUT handler:', {
              error,
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              templateId,
              userId: user?.id,
              userType: profile?.user_type
            })
            return new Response(
              JSON.stringify({ 
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }

        if (req.method === 'DELETE') {
          const { error: deleteError } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId)

          if (deleteError) {
            console.error('Error deleting template:', deleteError)
            return new Response(
              JSON.stringify({ error: 'Failed to delete template', details: deleteError.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          return new Response(
            JSON.stringify({ success: true }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      // GET template by ID (public)
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .single()

        if (error) {
          console.error('Error fetching template:', error)
          return new Response(
            JSON.stringify({ error: 'Template not found', details: error.message }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ data }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Handle /templates (GET and POST)
    if (req.method === 'GET') {
      // Get user information from Authorization header
      const authHeader = req.headers.get('authorization')
      let currentUserRole = 'user'
      let currentUserId: string | null = null
      
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user }, error: authError } = await supabase.auth.getUser(token)
          
          if (!authError && user) {
            currentUserId = user.id
            // Get user role from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', user.id)
              .single()
            
            if (profile) {
              currentUserRole = profile.user_type
            }
          }
        } catch (error) {
          console.warn('Error getting user role:', error)
        }
      }
      
      // Build query based on user role
      let query = supabase
        .from('templates')
        .select('*')
      
      // Filter templates based on user role
      if (currentUserRole === 'user') {
        if (currentUserId) {
          // User is logged in - show admin/owner templates + their own templates
          query = query.or(`user_type.in.(admin,owner),user_id.eq.${currentUserId}`)
        } else {
          // User is not logged in - show only admin/owner templates
          query = query.in('user_type', ['admin', 'owner'])
        }
      }
      // Admin and Owner can see all templates (no additional filtering needed)
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
        return new Response(
          JSON.stringify({ 
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ templates: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      // Authenticate user
      const { user, error: authError } = await authenticateUser(req)
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', details: authError || 'Invalid token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const body = await req.json().catch(() => null)
      
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { name, paper, elements, user_id, preview_image } = body

      if (!name || !paper || !elements) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get user role for the template creator
      const targetUserId = user_id || user.id
      let userType = 'user'
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', targetUserId)
        .single()
      
      if (profile) {
        userType = profile.user_type
      }

      // Create template data for database
      const templateData = {
        name,
        theme: paper.background?.type || 'default',
        preview_url: preview_image || '',
        paper_settings: paper,
        elements: elements,
        user_id: targetUserId,
        user_type: userType,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('templates')
        .insert([templateData])
        .select()
        .single()

      if (error) {
        console.error('Error saving template:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Templates error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      method: req.method,
      url: req.url
    })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage,
        stack: errorStack // Include stack in development
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

