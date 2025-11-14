// Interactive setup script for first owner
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupFirstOwner() {
  console.log('🚀 eBizCard Owner Setup Script');
  console.log('===============================');
  console.log('');
  
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/setup-owner-interactive.js <email>');
    rl.close();
    process.exit(1);
  }

  console.log(`📧 Setting up owner for: ${email}`);
  console.log('');

  try {
    // Get Supabase credentials
    const supabaseUrl = await askQuestion('🔗 Enter your Supabase URL: ');
    const serviceRoleKey = await askQuestion('🔑 Enter your Supabase Service Role Key: ');
    
    console.log('');
    console.log('🔗 Connecting to Supabase...');
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log(`🔍 Looking for user with email: ${email}`);
    
    // First, get the user from auth.users using the admin client
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError.message);
      rl.close();
      process.exit(1);
    }

    // Find user by email
    const authUser = users.users.find(user => user.email === email);

    if (!authUser) {
      console.error('❌ User not found with email:', email);
      console.error('');
      console.error('Please make sure:');
      console.error('1. The user has registered an account');
      console.error('2. The email address is correct');
      console.error('3. The user has verified their email (if email verification is enabled)');
      rl.close();
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
      rl.close();
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
        rl.close();
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
        rl.close();
        process.exit(1);
      }
    }

    // Try to log the role change (optional)
    try {
      const { error: auditError } = await supabase
        .from('role_changes')
        .insert({
          user_id: authUser.id,
          old_role: profile?.user_type || 'user',
          new_role: 'owner',
          changed_by: authUser.id,
          reason: 'Initial owner setup'
        });

      if (auditError) {
        console.warn('⚠️ Warning: Could not log role change (this is okay):', auditError.message);
      } else {
        console.log('📋 Role change logged successfully');
      }
    } catch (auditError) {
      console.warn('⚠️ Warning: Could not log role change (this is okay)');
    }

    console.log('');
    console.log('🎉 Successfully set user as owner!');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${authUser.id}`);
    console.log(`👑 Role: Owner`);
    console.log('');
    console.log('🔐 This user now has full administrative privileges and can:');
    console.log('   - Manage other users\' roles');
    console.log('   - Access admin dashboard at /admin/users');
    console.log('   - Perform all administrative actions');
    console.log('');
    console.log('✅ Setup complete! You can now log in as this user and access the admin panel.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('1. Check your Supabase URL and Service Role Key');
    console.error('2. Make sure the user has registered and verified their email');
    console.error('3. Check your database connection');
  } finally {
    rl.close();
  }
}

// Run the script
setupFirstOwner();
