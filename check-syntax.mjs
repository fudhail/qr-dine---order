import fs from 'fs';
import * as babel from '@babel/core';
import presetReact from '@babel/preset-react';

const code = fs.readFileSync('./src/apps/Kitchen/KitchenApp.jsx', 'utf-8');
try {
  babel.transformSync(code, {
    presets: [presetReact],
    filename: 'KitchenApp.jsx'
  });
  console.log('KitchenApp.jsx syntax is OK');
} catch (e) {
  console.error('KitchenApp.jsx SYNTAX ERROR:', e.message);
}

const adminCode = fs.readFileSync('./src/apps/Admin/AdminApp.jsx', 'utf-8');
try {
  babel.transformSync(adminCode, {
    presets: [presetReact],
    filename: 'AdminApp.jsx'
  });
  console.log('AdminApp.jsx syntax is OK');
} catch (e) {
  console.error('AdminApp.jsx SYNTAX ERROR:', e.message);
}
