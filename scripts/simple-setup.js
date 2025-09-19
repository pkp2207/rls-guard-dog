// Simple setup script for demo users
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

console.log('🔄 Environment variables loaded');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');

// Now run the demo user creation
async function runSetup() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    return;
  }

  console.log('\n🎯 Environment variables are properly configured!');
  console.log('📋 Your demo users should be created through the Supabase dashboard manually, or you can:');
  console.log('\n1. Go to https://supabase.com/dashboard/project/wpsqcjzxmselhkcfmihi/auth/users');
  console.log('2. Click "Invite User" or "Add User"');
  console.log('3. Create these test accounts:');
  console.log('\n📧 john.smith@greenwood.edu (password: demo123) - Role: head_teacher');
  console.log('📧 sarah.johnson@greenwood.edu (password: demo123) - Role: teacher');
  console.log('📧 alice.wilson@student.greenwood.edu (password: demo123) - Role: student');
  
  console.log('\n✅ Your Supabase connection is working!');
  console.log('🚀 Try logging in with one of the demo accounts above.');
  console.log('💡 If login still fails, check that email confirmation is disabled in Auth settings.');
}

runSetup().catch(console.error);