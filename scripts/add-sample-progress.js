// Add sample progress data to the database
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...values] = trimmed.split('=');
    process.env[key.trim()] = values.join('=').trim();
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addSampleProgress() {
  console.log('🚀 Adding Sample Progress Data');
  console.log('=============================');

  try {
    // Get the student and teacher IDs
    const { data: students } = await supabase.from('students').select('id, first_name, last_name');
    const { data: teachers } = await supabase.from('teachers').select('id, first_name, last_name');
    const { data: schools } = await supabase.from('schools').select('id').limit(1);

    if (!students?.length || !teachers?.length || !schools?.length) {
      console.log('❌ Missing required data (students, teachers, or schools)');
      return;
    }

    const student = students[0];
    const teacher = teachers[0];
    const school = schools[0];

    console.log(`👥 Found student: ${student.first_name} ${student.last_name}`);
    console.log(`👩‍🏫 Found teacher: ${teacher.first_name} ${teacher.last_name}`);

    // Sample progress records
    const progressRecords = [
      {
        student_id: student.id,
        teacher_id: teacher.id,
        school_id: school.id,
        subject: 'math',
        assignment_name: 'Algebra Quiz 1',
        score: 85,
        max_score: 100,
        notes: 'Good understanding of basic concepts',
        completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
      },
      {
        student_id: student.id,
        teacher_id: teacher.id,
        school_id: school.id,
        subject: 'science',
        assignment_name: 'Biology Test',
        score: 92,
        max_score: 100,
        notes: 'Excellent work on cell structure',
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        student_id: student.id,
        teacher_id: teacher.id,
        school_id: school.id,
        subject: 'english',
        assignment_name: 'Essay Writing',
        score: 78,
        max_score: 100,
        notes: 'Good structure, needs work on grammar',
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        student_id: student.id,
        teacher_id: teacher.id,
        school_id: school.id,
        subject: 'math',
        assignment_name: 'Geometry Homework',
        score: 88,
        max_score: 100,
        notes: 'Improving with practice',
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];

    // Insert progress records
    const { data, error } = await supabase
      .from('progress')
      .insert(progressRecords)
      .select();

    if (error) {
      console.error('❌ Error inserting progress data:', error);
      return;
    }

    console.log(`✅ Successfully added ${data.length} progress records!`);
    console.log('\n📊 Sample Progress Data:');
    data.forEach(record => {
      console.log(`   - ${record.subject}: ${record.score}/${record.max_score} (${Math.round((record.score/record.max_score)*100)}%)`);
    });

    console.log('\n🎯 Teacher dashboard should now show data!');
    console.log('Try refreshing the teacher page.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSampleProgress().catch(console.error);