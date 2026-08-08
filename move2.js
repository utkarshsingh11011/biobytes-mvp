const fs = require('fs');
const path = require('path');

const moves = [
  { src: 'app/(auth)/login', dest: 'src/frontend/features/auth/pages/login' },
  { src: 'app/(auth)/register', dest: 'src/frontend/features/auth/pages/register' },
  { src: 'app/(public)/doctors', dest: 'src/frontend/features/public/pages/doctors' },
  { src: 'app/(public)/labs', dest: 'src/frontend/features/public/pages/labs' },
  { src: 'app/(public)/patients', dest: 'src/frontend/features/public/pages/patients' },
];

moves.forEach(m => {
  try {
    const destParent = path.dirname(path.join(__dirname, m.dest));
    fs.mkdirSync(destParent, { recursive: true });
    fs.renameSync(path.join(__dirname, m.src), path.join(__dirname, m.dest));
    console.log(`Moved ${m.src} to ${m.dest}`);
  } catch (err) {
    console.error(`Failed to move ${m.src}: ${err.message}`);
  }
});
