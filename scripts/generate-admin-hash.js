// ============================================
// Generate Admin Password Hash
// ============================================
// This script generates the bcrypt hash for admin password

const bcrypt = require('bcryptjs');

const password = 'Weorex@biz88';
const email = 'weorex@admin.com';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('\n===========================================');
  console.log('ADMIN CREDENTIALS');
  console.log('===========================================');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Password Hash:', hash);
  console.log('===========================================\n');
  
  console.log('SQL COMMAND TO RUN:\n');
  console.log(`DELETE FROM users WHERE email = '${email}';\n`);
  console.log(`INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, created_at)`);
  console.log(`VALUES ('${email}', '${hash}', 'Weorex', 'Admin', 'admin', 1, 1, NOW());\n`);
  console.log('===========================================\n');
});
