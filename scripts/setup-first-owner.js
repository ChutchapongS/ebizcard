const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from the correct path
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

// Check if required environment variables are present
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('');
  console.error('Please make sure your .env.local file exists in apps/web/ and contains these variables.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupFirstOwner() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/setup-first-owner.js <email>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // First, get the user from auth.users using the admin client
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError.message);
      process.exit(1);
    }

    // Find user by email
    const authUser = users.users.find(user => user.email === email);

    if (!authUser) {
      console.error('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log(`✅ Found user: ${authUser.email} (ID: ${authUser.id})`);

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError.message);
      process.exit(1);
    }

    if (!profile) {
      console.log('📝 Creating profile for user...');
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || '',
          user_type: 'owner',
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        process.exit(1);
      }
    } else {
      console.log('📝 Updating existing profile to owner...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'owner',
          is_active: true,
          role_updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
        process.exit(1);
      }
    }

    // Log the role change
    const { error: auditError } = await supabase
      .from('role_changes')
      .insert({
        user_id: authUser.id,
        old_role: profile?.user_type || 'user',
        new_role: 'owner',
        changed_by: authUser.id, // Self-assignment for initial setup
        reason: 'Initial owner setup'
      });

    if (auditError) {
      console.warn('⚠️ Warning: Could not log role change:', auditError.message);
    }

    console.log('🎉 Successfully set user as owner!');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${authUser.id}`);
    console.log(`👑 Role: Owner`);
    console.log('');
    console.log('🔐 This user now has full administrative privileges and can:');
    console.log('   - Manage other users\' roles');
    console.log('   - Access admin dashboard');
    console.log('   - Perform all administrative actions');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
setupFirstOwner();
