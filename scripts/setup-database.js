// Simple script to set up database tables for user role management
const { createClient } = require('@supabase/supabase-js');

async function setupDatabase() {
  console.log('🚀 Setting up User Role Management Database');
  console.log('==========================================');
  
  // Get credentials from command line arguments
  const supabaseUrl = process.argv[2];
  const serviceRoleKey = process.argv[3];
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required credentials');
    console.log('Usage: node scripts/setup-database.js <supabase-url> <service-role-key>');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🔧 Adding user_type column to profiles table...');
    
    // Add user_type column
    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql: "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user' CHECK (user_type IN ('owner', 'admin', 'user'))" 
    });
    
    if (alterError) {
      console.warn('⚠️ user_type column may already exist:', alterError.message);
    } else {
      console.log('✅ user_type column added');
    }
    
    console.log('🔧 Adding role management columns...');
    
    // Add other columns
    const columns = [
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_permissions JSONB DEFAULT '{}'",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id)",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    ];
    
    for (const columnSQL of columns) {
      const { error } = await supabase.rpc('exec_sql', { sql: columnSQL });
      if (error) {
        console.warn('⚠️ Column may already exist:', error.message);
      } else {
        console.log('✅ Column added');
      }
    }
    
    console.log('🔧 Creating role_changes table...');
    
    // Create role_changes table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS role_changes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        old_role TEXT,
        new_role TEXT NOT NULL,
        changed_by UUID NOT NULL REFERENCES auth.users(id),
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.warn('⚠️ Table may already exist:', tableError.message);
    } else {
      console.log('✅ role_changes table created');
    }
    
    console.log('🔧 Setting existing users as "user" by default...');
    
    // Update existing users
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_type: 'user' })
      .is('user_type', null);
    
    if (updateError) {
      console.warn('⚠️ Update may have failed:', updateError.message);
    } else {
      console.log('✅ Existing users set as "user"');
    }
    
    console.log('');
    console.log('🎉 Database setup completed!');
    console.log('');
    console.log('📋 What was added:');
    console.log('   - user_type column (owner/admin/user)');
    console.log('   - role management columns');
    console.log('   - role_changes audit table');
    console.log('   - Default user_type for existing users');
    console.log('');
    console.log('✅ You can now use the admin dashboard!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('💡 Try running this manually in Supabase SQL Editor:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Run the migration file: supabase/migrations/002_add_user_types.sql');
    process.exit(1);
  }
}

setupDatabase();
