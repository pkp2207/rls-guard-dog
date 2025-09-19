// Create profiles for existing auth users
import fs from 'fs';
import path from 'path';

// Manually load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...values] = trimmed.split('=');
    process.env[key.trim()] = values.join('=').trim();
  }
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const schoolId = '550e8400-e29b-41d4-a716-446655440001';

// User profile mappings
const userProfiles = {
  'john.smith@greenwood.edu': {
    role: 'head_teacher',
    first_name: 'John',
    last_name: 'Smith',
    classes: ['5th Grade', '4th Grade'],
    subjects: ['math', 'science']
  },
  'sarah.johnson@greenwood.edu': {
    role: 'teacher',
    first_name: 'Sarah',
    last_name: 'Johnson',
    classes: ['3rd Grade'],
    subjects: ['math', 'english']
  },
  'alice.wilson@student.greenwood.edu': {
    role: 'student',
    first_name: 'Alice',
    last_name: 'Wilson',
    class_name: '5th Grade',
    year_group: 5
  }
};

async function getAuthUsers() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    return data.users;
  } catch (error) {
    console.error('❌ Error fetching auth users:', error);
    return [];
  }
}

async function createProfileForUser(user, profileData) {
  console.log(`\n👤 Creating profile for: ${user.email}`);
  
  try {
    if (profileData.role === 'student') {
      // Create student profile
      const { error } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          school_id: schoolId,
          class_name: profileData.class_name,
          year_group: profileData.year_group
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`✅ Student profile already exists: ${profileData.first_name} ${profileData.last_name}`);
          return true;
        }
        console.error(`❌ Failed to create student profile:`, error.message);
        return false;
      }
      
      console.log(`✅ Created student profile: ${profileData.first_name} ${profileData.last_name} (${profileData.class_name})`);
      
    } else {
      // Create teacher profile
      const { error } = await supabase
        .from('teachers')
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          school_id: schoolId,
          role: profileData.role,
          classes: profileData.classes,
          subjects: profileData.subjects
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`✅ Teacher profile already exists: ${profileData.first_name} ${profileData.last_name}`);
          return true;
        }
        console.error(`❌ Failed to create teacher profile:`, error.message);
        return false;
      }
      
      console.log(`✅ Created teacher profile: ${profileData.first_name} ${profileData.last_name} (${profileData.role})`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error creating profile for ${user.email}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating Profiles for Existing Users');
  console.log('======================================');
  
  // Get all auth users
  const authUsers = await getAuthUsers();
  console.log(`\n📋 Found ${authUsers.length} auth users`);
  
  let successCount = 0;
  
  for (const user of authUsers) {
    const profileData = userProfiles[user.email];
    
    if (!profileData) {
      console.log(`⚠️  No profile mapping found for: ${user.email}`);
      continue;
    }
    
    const success = await createProfileForUser(user, profileData);
    if (success) successCount++;
  }
  
  console.log(`\n🎉 Profile creation complete! Created ${successCount} profiles.`);
  
  if (successCount > 0) {
    console.log('\n📝 You can now test login with:');
    console.log('   Email: john.smith@greenwood.edu');
    console.log('   Password: demo123');
    console.log('   Role: head_teacher');
    
    console.log('\n   Email: sarah.johnson@greenwood.edu');
    console.log('   Password: demo123');
    console.log('   Role: teacher');
    
    console.log('\n   Email: alice.wilson@student.greenwood.edu');
    console.log('   Password: demo123');
    console.log('   Role: student');
    
    console.log('\n✨ The "User profile not found" error should now be resolved!');
  }
}

main().catch(console.error);