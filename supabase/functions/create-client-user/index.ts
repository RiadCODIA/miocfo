import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
  vatNumber?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client to verify the caller's identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is logged in and is an admin
    const { data: { user: callerUser }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !callerUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Caller user ID:', callerUser.id);

    // Check if caller has admin_aziendale role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin_aziendale')
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error checking user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData) {
      console.error('User is not an admin_aziendale');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admin_aziendale can create client users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateClientRequest = await req.json();
    const { email, password, firstName, lastName, companyName, phone, vatNumber } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, firstName, lastName, companyName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating user for:', email);

    // 1. Create the user in auth.users using admin API
    const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName
      }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createUserError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = newUserData.user.id;
    console.log('User created with ID:', newUserId);

    // 2. Create the company
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        email: email,
        phone: phone || null,
        vat_number: vatNumber || null,
        status: 'active',
        alerts_count: 0,
        revenue: 0,
        cashflow: 0,
        owner_id: callerUser.id, // The admin is the owner
        user_id: newUserId // The client user is linked to the company
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      // Try to clean up the user we just created
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to create company: ${companyError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Company created:', companyData.id);

    // 3. Assign 'user' role to the new user
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: 'user'
      });

    if (roleInsertError) {
      console.error('Error assigning role:', roleInsertError);
      // Note: We don't fail the whole operation for this, user can still function
    }

    // 4. Link admin to client in admin_clients table
    const { error: linkError } = await supabaseAdmin
      .from('admin_clients')
      .insert({
        admin_id: callerUser.id,
        client_id: companyData.id
      });

    if (linkError) {
      console.error('Error linking admin to client:', linkError);
      // This is critical - clean up if it fails
      await supabaseAdmin.from('companies').delete().eq('id', companyData.id);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to link client to admin: ${linkError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Client linked to admin successfully');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Client user created successfully',
        data: {
          userId: newUserId,
          companyId: companyData.id,
          email: email,
          companyName: companyName
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
