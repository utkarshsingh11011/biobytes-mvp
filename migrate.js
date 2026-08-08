const fs = require('fs');
const path = require('path');

const dirs = [
  'src/frontend/components/ui',
  'src/frontend/features/auth',
  'src/frontend/features/patient',
  'src/frontend/features/doctor',
  'src/frontend/features/admin',
  'src/frontend/features/public',
  'src/frontend/layouts',
  'src/frontend/services',
  'src/frontend/utils',
  'src/backend/controllers',
  'src/backend/routes',
  'src/backend/services',
  'src/backend/models',
  'src/backend/middlewares',
  'src/backend/config'
];

dirs.forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
  console.log(`Created ${dir}`);
});
