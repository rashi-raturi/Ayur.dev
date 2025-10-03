import 'dotenv/config';
import addDoctorRegistrationNumbers from './migrations/add-doctor-registration-numbers.js';

// Run the migration
console.log('Running doctor registration number migration...');
addDoctorRegistrationNumbers()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });