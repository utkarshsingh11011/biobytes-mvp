const fs = require('fs');
const path = require('path');

const mappings = [
  { dest: 'app/(admin)/admin/layout.tsx', source: '@frontend/features/admin/pages/layout' },
  { dest: 'app/(admin)/admin/page.tsx', source: '@frontend/features/admin/pages/page' },
  { dest: 'app/(admin)/admin/users/page.tsx', source: '@frontend/features/admin/pages/users/page' },
  { dest: 'app/(admin)/admin/documents/page.tsx', source: '@frontend/features/admin/pages/documents/page' },
  { dest: 'app/(admin)/admin/settings/page.tsx', source: '@frontend/features/admin/pages/settings/page' },

  { dest: 'app/(auth)/login/page.tsx', source: '@frontend/features/auth/pages/login/page' },
  { dest: 'app/(auth)/register/page.tsx', source: '@frontend/features/auth/pages/register/page' },

  { dest: 'app/(doctor)/doctor/access/page.tsx', source: '@frontend/features/doctor/pages/access/page' },
  { dest: 'app/(doctor)/doctor/dashboard/page.tsx', source: '@frontend/features/doctor/pages/dashboard/page' },
  { dest: 'app/(doctor)/doctor/patient/[sessionId]/page.tsx', source: '@frontend/features/doctor/pages/patient/[sessionId]/page' },

  { dest: 'app/(patient)/patient/appointments/page.tsx', source: '@frontend/features/patient/pages/appointments/page' },
  { dest: 'app/(patient)/patient/book/[doctorId]/page.tsx', source: '@frontend/features/patient/pages/book/[doctorId]/page' },
  { dest: 'app/(patient)/patient/dashboard/page.tsx', source: '@frontend/features/patient/pages/dashboard/page' },
  { dest: 'app/(patient)/patient/partners/page.tsx', source: '@frontend/features/patient/pages/partners/page' },
  { dest: 'app/(patient)/patient/trends/page.tsx', source: '@frontend/features/patient/pages/trends/page' },
  { dest: 'app/(patient)/patient/upload/page.tsx', source: '@frontend/features/patient/pages/upload/page' },

  { dest: 'app/(public)/doctors/page.tsx', source: '@frontend/features/public/pages/doctors/page' },
  { dest: 'app/(public)/labs/page.tsx', source: '@frontend/features/public/pages/labs/page' },
  { dest: 'app/(public)/patients/page.tsx', source: '@frontend/features/public/pages/patients/page' },
];

mappings.forEach(m => {
  const destPath = path.join(__dirname, m.dest);
  const content = `export { default } from "${m.source}";\n`;
  
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content);
});

console.log("Created thin wrappers for all pages.");
