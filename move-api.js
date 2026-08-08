const fs = require('fs');
const path = require('path');

function moveApiRoutes(dir, baseApiDir, destBaseDir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      moveApiRoutes(filePath, baseApiDir, destBaseDir);
    } else if (file === 'route.ts') {
      // Calculate relative path from app/api
      const relativePath = path.relative(baseApiDir, filePath);
      
      // Calculate destination path
      const destPath = path.join(destBaseDir, relativePath);
      
      // Create destination directory
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      
      // Move file
      fs.renameSync(filePath, destPath);
      console.log(`Moved API route: ${relativePath}`);
      
      // Create thin wrapper in the original location
      // Determine what methods to export by rudely scanning for 'export async function GET' etc.
      const destContent = fs.readFileSync(destPath, 'utf8');
      const exports = [];
      ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].forEach(method => {
        if (destContent.includes(`export async function ${method}`) || destContent.includes(`export function ${method}`)) {
          exports.push(method);
        }
      });
      
      // We need to calculate the import path.
      // E.g., if relativePath is "admin/users/route.ts", import is "@backend/routes/admin/users/route"
      const importPath = `@backend/routes/${relativePath.replace(/\\/g, '/').replace('.ts', '')}`;
      
      let wrapperContent = `// Thin wrapper for Next.js App Router\n`;
      if (exports.length > 0) {
        wrapperContent += `export { ${exports.join(', ')} } from "${importPath}";\n`;
      } else {
        wrapperContent += `// No recognized HTTP methods found\n`;
      }
      
      fs.writeFileSync(filePath, wrapperContent);
    }
  }
}

const apiDir = path.join(__dirname, 'app/api');
const controllersDir = path.join(__dirname, 'src/backend/routes');

moveApiRoutes(apiDir, apiDir, controllersDir);
