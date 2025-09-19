// Test Supabase Connection and Create Demo Users
// Run this script to verify your Supabase connection and create test users

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗');
  process.exit(1);
}

// Create admin client (with service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Demo users to create
const demoUsers = [
  {
    email: 'john.smith@greenwood.edu',
    password: 'demo123',
    role: 'head_teacher',
    first_name: 'John',
    last_name: 'Smith',
    school_id: '550e8400-e29b-41d4-a716-446655440001'
  },
  {
    email: 'sarah.johnson@greenwood.edu',
    password: 'demo123',
    role: 'teacher',
    first_name: 'Sarah',
    last_name: 'Johnson',
    school_id: '550e8400-e29b-41d4-a716-446655440001'
  },
  {
    email: 'alice.wilson@student.greenwood.edu',
    password: 'demo123',
    role: 'student',
    first_name: 'Alice',
    last_name: 'Wilson',
    school_id: '550e8400-e29b-41d4-a716-446655440001'
  }
];

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // Test the connection by getting the current session
    const { error } = await supabaseAdmin.auth.getSession();
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

async function createDemoUser(user) {
  console.log(`\n👤 Creating user: ${user.email}`);
  
  try {
    // Create the user with admin privileges
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        school_id: user.school_id
      }
    });

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
      return false;
    }

    console.log(`✅ Successfully created ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${user.email}:`, error);
    return false;
  }
}

async function listExistingUsers() {
  console.log('\n📋 Checking existing users...');
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Failed to list users:', error.message);
      return;
    }

    if (data.users.length === 0) {
      console.log('📭 No users found in the database');
    } else {
      console.log(`📊 Found ${data.users.length} existing users:`);
      data.users.forEach(user => {
        console.log(`   - ${user.email} (${user.user_metadata?.role || 'no role'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function main() {
  console.log('🚀 Supabase Demo User Setup');
  console.log('==========================');
  
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('\n💡 Check your .env.local file and make sure:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL is your project URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY is your service role key');
    return;
  }

  // List existing users
  await listExistingUsers();

  // Create demo users
  console.log('\n🔧 Creating demo users...');
  let successCount = 0;
  
  for (const user of demoUsers) {
    const success = await createDemoUser(user);
    if (success) successCount++;
  }

  console.log(`\n🎉 Setup complete! Created ${successCount}/${demoUsers.length} demo users.`);
  console.log('\n📝 You can now test login with:');
  console.log('   Email: john.smith@greenwood.edu');
  console.log('   Password: demo123');
  console.log('   Role: head_teacher');
}

// Run the setup
main().catch(console.error);