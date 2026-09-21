/**
 * CLI Emergency Admin Password Reset Tool.
 * Requires direct access to server console (Government physical security simulation).
 * Usage: node reset-password.js <new_password>
 */
const bcrypt = require('bcryptjs');
const db = require('./src/db/database');

const newPassword = process.argv[2];

if (!newPassword || newPassword.length < 8) {
    console.error('❌ Error: Please specify a new password (min 8 characters).');
    console.error('Usage: node reset-password.js <new_password>');
    process.exit(1);
}

const saltRounds = 12;
const passwordHash = bcrypt.hashSync(newPassword, saltRounds);

const admin = db.prepare('SELECT * FROM admin LIMIT 1').get();

if (!admin) {
    console.error('❌ Error: No admin account found to reset. Please run system setup via UI.');
    process.exit(1);
}

db.prepare('UPDATE admin SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
  .run(passwordHash, admin.id);

console.log('==================================================');
console.log(`✅ ADMIN PASSWORD RESET SUCCESSFUL FOR USER: ${admin.username}`);
console.log('🔒 Account unlocked. Failed attempts reset to 0.');
console.log('==================================================');
