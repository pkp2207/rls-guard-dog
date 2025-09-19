// Complete database setup with schools, users, and profiles
const fs = require('fs');
const path = require('path');

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

console.log('🔄 Environment variables loaded');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample school data
const schoolData = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Greenwood Elementary School',
  address: '123 Oak Street, Springfield, IL 62701'
};

// Demo users with complete profile data
const demoUsers = [
  {
    email: 'john.smith@greenwood.edu',
    password: 'demo123',
    role: 'head_teacher',
    first_name: 'John',
    last_name: 'Smith',
    school_id: schoolData.id,
    classes: ['5th Grade', '4th Grade'],
    subjects: ['math', 'science']
  },
  {
    email: 'sarah.johnson@greenwood.edu',
    password: 'demo123',
    role: 'teacher',
    first_name: 'Sarah',
    last_name: 'Johnson',
    school_id: schoolData.id,
    classes: ['3rd Grade'],
    subjects: ['math', 'english']
  },
  {
    email: 'alice.wilson@student.greenwood.edu',
    password: 'demo123',
    role: 'student',
    first_name: 'Alice',
    last_name: 'Wilson',
    school_id: schoolData.id,
    class_name: '5th Grade',
    year_group: 5
  }
];

async function createSchool() {
  console.log('\n🏫 Setting up school...');
  
  try {
    // Check if school already exists
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolData.id)
      .single();
      
    if (existingSchool) {
      console.log('✅ School already exists');
      return;
    }
    
    // Create the school
    const { error } = await supabase
      .from('schools')
      .insert(schoolData);
      
    if (error) {
      console.error('❌ Failed to create school:', error.message);
      return false;
    }
    
    console.log(`✅ Created school: ${schoolData.name}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating school:', error);
    return false;
  }
}

async function createUserWithProfile(user) {
  console.log(`\n👤 Creating user: ${user.email}`);
  
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        school_id: user.school_id
      }
    });

    if (authError) {
      console.error(`❌ Failed to create auth user ${user.email}:`, authError.message);
      return false;
    }

    const userId = authData.user.id;
    console.log(`✅ Created auth user: ${user.email}`);

    // Then create the profile in the appropriate table
    if (user.role === 'student') {
      const { error: profileError } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          school_id: user.school_id,
          class_name: user.class_name,
          year_group: user.year_group
        });

      if (profileError) {
        console.error(`❌ Failed to create student profile:`, profileError.message);
        return false;
      }
      
      console.log(`✅ Created student profile: ${user.first_name} ${user.last_name} (${user.class_name})`);
      
    } else {
      // Teacher or head_teacher
      const { error: profileError } = await supabase
        .from('teachers')
        .insert({
          user_id: userId,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          school_id: user.school_id,
          role: user.role,
          classes: user.classes,
          subjects: user.subjects
        });

      if (profileError) {
        console.error(`❌ Failed to create teacher profile:`, profileError.message);
        return false;
      }
      
      console.log(`✅ Created teacher profile: ${user.first_name} ${user.last_name} (${user.role})`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error creating user ${user.email}:`, error);
    return false;
  }
}

async function listExistingData() {
  console.log('\n📋 Checking existing data...');
  
  try {
    // Check schools
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name');
    
    // Check auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    // Check teachers
    const { data: teachers } = await supabase
      .from('teachers')
      .select('id, email, role');
    
    // Check students
    const { data: students } = await supabase
      .from('students')
      .select('id, email, class_name');

    console.log(`📊 Current database state:`);
    console.log(`   - Schools: ${schools?.length || 0}`);
    console.log(`   - Auth Users: ${authUsers?.users?.length || 0}`);
    console.log(`   - Teachers: ${teachers?.length || 0}`);
    console.log(`   - Students: ${students?.length || 0}`);
    
    if (schools?.length > 0) {
      console.log(`\n🏫 Schools:`);
      schools.forEach(school => console.log(`   - ${school.name}`));
    }
    
    if (authUsers?.users?.length > 0) {
      console.log(`\n👥 Auth Users:`);
      authUsers.users.forEach(user => console.log(`   - ${user.email}`));
    }
    
  } catch (error) {
    console.error('❌ Error listing data:', error);
  }
}

async function main() {
  console.log('🚀 Complete RLS Guard Dog Database Setup');
  console.log('==========================================');
  
  // Check existing data
  await listExistingData();
  
  // Create school
  const schoolCreated = await createSchool();
  if (!schoolCreated && !await checkSchoolExists()) {
    console.log('❌ Cannot continue without school data');
    return;
  }
  
  // Create users with profiles
  console.log('\n🔧 Creating demo users with profiles...');
  let successCount = 0;
  
  for (const user of demoUsers) {
    const success = await createUserWithProfile(user);
    if (success) successCount++;
  }

  console.log(`\n🎉 Setup complete! Created ${successCount}/${demoUsers.length} users with profiles.`);
  
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
  }
}

async function checkSchoolExists() {
  try {
    const { data } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolData.id)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

// Run the setup
main().catch(console.error);