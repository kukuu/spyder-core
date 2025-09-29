// validate-env.js
require('dotenv').config();

const requiredEnvVars = [
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'HUGGINGFACE_API_KEY',
  'CLERK_SECRET_KEY'
];

console.log('🔍 Validating environment variables...\n');

let allRequiredPresent = true;

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    allRequiredPresent = false;
  } else {
    console.log(`✅ ${envVar}: Present`);
  }
});

console.log('\n📋 Optional environment variables:');
optionalEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`⚠️  ${envVar}: Not set (optional)`);
  } else {
    console.log(`✅ ${envVar}: Present`);
  }
});

if (allRequiredPresent) {
  console.log('\n🎉 All required environment variables are set!');
  console.log('🚀 You can now start the application with: npm run dev');
} else {
  console.log('\n❌ Please set the missing required environment variables.');
  process.exit(1);
}