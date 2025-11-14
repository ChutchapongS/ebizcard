#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up e-BizCard environment...\n');

// Create .env files from examples
const envFiles = [
  {
    source: 'apps/web/env.example',
    target: 'apps/web/.env.local',
    name: 'Web App'
  },
  {
    source: 'apps/mobile/env.example',
    target: 'apps/mobile/.env.local',
    name: 'Mobile App'
  }
];

envFiles.forEach(({ source, target, name }) => {
  const sourcePath = path.join(process.cwd(), source);
  const targetPath = path.join(process.cwd(), target);
  
  if (fs.existsSync(sourcePath)) {
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Created ${name} environment file: ${target}`);
    } else {
      console.log(`⚠️  ${name} environment file already exists: ${target}`);
    }
  } else {
    console.log(`❌ Source file not found: ${source}`);
  }
});

console.log('\n📝 Next steps:');
console.log('1. Update the environment variables in the .env.local files');
console.log('2. Set up your Supabase project');
console.log('3. Run: npm run supabase:start');
console.log('4. Run: npm run dev\n');

console.log('🔗 Useful links:');
console.log('- Supabase Dashboard: https://supabase.com/dashboard');
console.log('- Expo Dashboard: https://expo.dev');
console.log('- Next.js Documentation: https://nextjs.org/docs\n');
