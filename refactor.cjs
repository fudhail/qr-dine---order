const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\fudha\\Desktop\\wapdms-frontend\\src';

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        filelist = walkSync(filepath, filelist);
      }
    } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.js')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

console.log("1. Moving services/api/* to services/...");
const apiDir = path.join(srcDir, 'services', 'api');
const servicesDir = path.join(srcDir, 'services');
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    fs.renameSync(path.join(apiDir, file), path.join(servicesDir, file));
  }
  fs.rmdirSync(apiDir);
}

console.log("2. Cleaning up duplicate client.ts...");
if (fs.existsSync(path.join(servicesDir, 'client.ts'))) {
  fs.unlinkSync(path.join(servicesDir, 'client.ts'));
}

console.log("3. Moving ProtectedRoute...");
const oldProtected = path.join(srcDir, 'routes', 'ProtectedRoute.tsx');
const newProtected = path.join(srcDir, 'components', 'auth', 'ProtectedRoute.tsx');
if (fs.existsSync(path.join(srcDir, 'components', 'auth'))) {
    if (fs.existsSync(oldProtected)) {
    fs.renameSync(oldProtected, newProtected);
    }
}

console.log("4. Moving CustomToast...");
const customToastOld = path.join(srcDir, 'common', 'CustomToast.tsx');
const customToastNew = path.join(srcDir, 'components', 'ui', 'CustomToast.tsx');
if (fs.existsSync(customToastOld)) {
  fs.renameSync(customToastOld, customToastNew);
}

console.log("5. Renaming stores...");
const storesDir = path.join(srcDir, 'stores');
const storeMap = {};
if (fs.existsSync(storesDir)) {
  const storeFiles = fs.readdirSync(storesDir);
  for (const file of storeFiles) {
    if (file.endsWith('Store.ts')) {
      const newName = file.replace('Store.ts', '.store.ts');
      fs.renameSync(path.join(storesDir, file), path.join(storesDir, newName));
      storeMap[file.replace('.ts', '')] = newName.replace('.ts', '');
    }
  }
}

console.log("6. Updating imports across codebase...");
const allFiles = walkSync(srcDir);
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  const origContent = content;

  // Update services/api/client -> lib/apiClient
  content = content.replace(/@\/services\/api\/client/g, '@/lib/apiClient');
  content = content.replace(/\.\.\/api\/client/g, '../../lib/apiClient');
  content = content.replace(/\.\/api\/client/g, '../lib/apiClient');
  
  // Update services/api -> services
  content = content.replace(/@\/services\/api/g, '@/services');
  content = content.replace(/services\/api/g, 'services'); // fallback
  
  // Update common/CustomToast -> components/ui/CustomToast
  content = content.replace(/@\/common\/CustomToast/g, '@/components/ui/CustomToast');
  
  // Update ProtectedRoute
  content = content.replace(/@\/routes\/ProtectedRoute/g, '@/components/auth/ProtectedRoute');
  content = content.replace(/\.\/ProtectedRoute/g, '../components/auth/ProtectedRoute');

  // Update stores
  for (const [oldStore, newStore] of Object.entries(storeMap)) {
    const regex1 = new RegExp(`@/stores/${oldStore}`, 'g');
    const regex2 = new RegExp(`\\.\\./stores/${oldStore}`, 'g');
    const regex3 = new RegExp(`\\./${oldStore}`, 'g');
    
    content = content.replace(regex1, `@/stores/${newStore}`);
    content = content.replace(regex2, `../stores/${newStore}`);
    
    // Careful with relative replacements in the stores directory itself
    if (file.includes(path.join('src', 'stores')) || file.includes(path.join('src', 'lib'))) {
        content = content.replace(regex3, `./${newStore}`);
    }
  }

  if (content !== origContent) {
    fs.writeFileSync(file, content, 'utf-8');
  }
}

console.log("7. Deleting unused directories...");
const dirsToDelete = [
  path.join(srcDir, 'common'),
  path.join(srcDir, 'data'),
  path.join(srcDir, 'components', 'layouts')
];
for (const d of dirsToDelete) {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true, force: true });
  }
}

console.log("Refactoring complete.");
