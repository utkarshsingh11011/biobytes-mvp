const fs = require('fs');
const path = require('path');

const moves = [
  { src: 'app/(admin)/admin', dest: 'src/frontend/features/admin/pages' },
  { src: 'app/(doctor)/doctor', dest: 'src/frontend/features/doctor/pages' },
  { src: 'app/(patient)/patient', dest: 'src/frontend/features/patient/pages' },
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
