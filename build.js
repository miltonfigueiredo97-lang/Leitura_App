import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const envKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

function replaceEnv(content){
  for (const key of envKeys) {
    const val = process.env[key] || '';
    content = content.replaceAll(`%${key}%`, val);
  }
  return content;
}

for (const file of ['index.html','mobile.html']) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) fs.writeFileSync(path.join(dist, file), replaceEnv(fs.readFileSync(src, 'utf8')));
}

function copyDir(src, dest){
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(path.join(root, 'public'), dist);
console.log('Build estático concluído em dist/');
