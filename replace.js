const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace component imports
  content = content.replace(/@\/components\//g, '@frontend/components/');
  content = content.replace(/@\/components\/ui\//g, '@frontend/components/ui/'); // (redundant but safe)
  
  // Replace layouts
  content = content.replace(/@\/components\/AdminSidebar/g, '@frontend/layouts/AdminSidebar');
  content = content.replace(/@\/components\/Navbar/g, '@frontend/layouts/Navbar');

  // Replace lib imports
  content = content.replace(/@\/lib\/auth/g, '@backend/config/auth');
  content = content.replace(/@\/lib\/prisma/g, '@backend/models/prisma');
  content = content.replace(/@\/lib\/utils/g, '@frontend/utils/utils');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
}

function walkSync(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // don't enter node_modules or .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkSync(filePath);
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  }
}

walkSync(path.join(__dirname, 'app'));
walkSync(path.join(__dirname, 'src'));
