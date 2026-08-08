const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/@frontend\/components\/Navbar/g, '@frontend/layouts/Navbar');
  content = content.replace(/@frontend\/components\/AdminSidebar/g, '@frontend/layouts/AdminSidebar');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated layout imports in ${filePath}`);
  }
}

function walkSync(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkSync(filePath);
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  }
}

walkSync(path.join(__dirname, 'src'));
walkSync(path.join(__dirname, 'app'));
