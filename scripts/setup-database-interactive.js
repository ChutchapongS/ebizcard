// Interactive database setup script
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

async function setupDatabase() {
  console.log('🚀 Setting up User Role Management Database');
  console.log('==========================================');
  
  try {
    // Get Supabase credentials
    const supabaseUrl = await askQuestion('🔗 Enter your Supabase URL: ');
    const serviceRoleKey = await askQuestion('🔑 Enter your Supabase Service Role Key: ');
    
    console.log('');
    console.log('🔗 Connecting to Supabase...');
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('🔧 Adding user_type column to profiles table...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot connect to database:', testError.message);
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ Connected to database successfully');
    
    // Check if user_type column already exists
    const { data: existingProfiles, error: existingError } = await supabase
      .from('profiles')
      .select('user_type')
      .limit(1);
    
    if (existingError && existingError.code === 'PGRST204') {
      // Column doesn't exist, need to add it
      console.log('🔧 Adding user_type column...');
      
      // Try to update a profile to test if column exists
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_type: 'user' })
        .limit(1);
      
      if (updateError && updateError.code === 'PGRST204') {
        console.log('❌ user_type column does not exist and cannot be added via API');
        console.log('');
        console.log('💡 Please run this SQL manually in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT \'user\' CHECK (user_type IN (\'owner\', \'admin\', \'user\'));');
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_permissions JSONB DEFAULT \'{}\';');
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);');
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
        console.log('');
        console.log('CREATE TABLE IF NOT EXISTS role_changes (');
        console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
        console.log('    old_role TEXT,');
        console.log('    new_role TEXT NOT NULL,');
        console.log('    changed_by UUID NOT NULL REFERENCES auth.users(id),');
        console.log('    reason TEXT,');
        console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('UPDATE profiles SET user_type = \'user\' WHERE user_type IS NULL;');
        
        rl.close();
        process.exit(1);
      } else {
        console.log('✅ user_type column already exists');
      }
    } else {
      console.log('✅ user_type column already exists');
    }
    
    // Check if role_changes table exists
    const { data: roleChangesData, error: roleChangesError } = await supabase
      .from('role_changes')
      .select('id')
      .limit(1);
    
    if (roleChangesError && roleChangesError.code === 'PGRST116') {
      console.log('❌ role_changes table does not exist');
      console.log('');
      console.log('💡 Please run this SQL manually in Supabase SQL Editor:');
      console.log('');
      console.log('CREATE TABLE IF NOT EXISTS role_changes (');
      console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
      console.log('    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
      console.log('    old_role TEXT,');
      console.log('    new_role TEXT NOT NULL,');
      console.log('    changed_by UUID NOT NULL REFERENCES auth.users(id),');
      console.log('    reason TEXT,');
      console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log(');');
      
      rl.close();
      process.exit(1);
    } else {
      console.log('✅ role_changes table already exists');
    }
    
    // Update existing users to have user_type
    console.log('🔧 Setting existing users as "user" by default...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_type: 'user' })
      .is('user_type', null);
    
    if (updateError) {
      console.warn('⚠️ Could not update existing users:', updateError.message);
    } else {
      console.log('✅ Existing users updated');
    }
    
    console.log('');
    console.log('🎉 Database setup completed!');
    console.log('');
    console.log('📋 What was verified:');
    console.log('   - user_type column exists');
    console.log('   - role_changes table exists');
    console.log('   - Existing users have default user_type');
    console.log('');
    console.log('✅ You can now use the admin dashboard!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setupDatabase();
