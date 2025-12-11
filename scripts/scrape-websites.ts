// scripts/scrape-websites.ts
import fs from 'fs';
import path from 'path';

const WEBSITES_DIR = path.join(process.cwd(), 'app', 'websites');

const folders = fs.readdirSync(WEBSITES_DIR)
  .filter(file => {
    const fullPath = path.join(WEBSITES_DIR, file);
    return fs.statSync(fullPath).isDirectory() && file !== 'page.tsx';
  });

const websites = folders.map(folder => ({
  id: folder,
  title: folder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  prompt: `A unique small business website built for ${folder.replace(/-/g, ' ')}.`,
}));

console.log('Found websites:', websites);

// Write to public folder so client can fetch it
fs.writeFileSync(
  path.join(process.cwd(), 'public', 'websites.json'),
  JSON.stringify(websites, null, 2)
);

console.log('✅ websites.json generated!');