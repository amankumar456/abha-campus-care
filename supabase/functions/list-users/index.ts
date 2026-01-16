import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token to check their role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to list users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 100,
    });

    if (listError) {
      throw listError;
    }

    // Get all user roles
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('user_id, role');

    // Get all doctors and mentors linked to users
    const { data: doctors } = await adminClient
      .from('medical_officers')
      .select('id, name, user_id')
      .not('user_id', 'is', null);

    const { data: mentors } = await adminClient
      .from('mentors')
      .select('id, name, user_id')
      .not('user_id', 'is', null);

    // Map users with their roles and linked profiles
    const usersWithRoles = users.map((u) => {
      const userRoles = roles?.filter(r => r.user_id === u.id).map(r => r.role) || [];
      const linkedDoctor = doctors?.find(d => d.user_id === u.id);
      const linkedMentor = mentors?.find(m => m.user_id === u.id);
      
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        roles: userRoles,
        linked_doctor: linkedDoctor || null,
        linked_mentor: linkedMentor || null,
      };
    });

    return new Response(JSON.stringify({ users: usersWithRoles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error listing users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
