// Links the shared package (@shieldguard/shared) into every app's node_modules
// as a live junction/symlink, so a fresh `npm install` in any app automatically
// connects it to the single source of truth. Edits to ../shared propagate
// immediately — no rebuild or reinstall required.
//
// Run manually with: npm run setup   (also wired as each app's postinstall)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'shared');
const linkType = process.platform === 'win32' ? 'junction' : 'dir';
const apps = ['shieldguard-backend', 'shieldguard-office', 'shieldguard-mobile'];

if (!fs.existsSync(target)) {
  console.error(`[link-shared] Cannot find ${target}`);
  process.exit(1);
}

for (const app of apps) {
  const ns = path.join(root, app, 'node_modules', '@shieldguard');
  fs.mkdirSync(ns, { recursive: true });
  const link = path.join(ns, 'shared');
  try {
    fs.rmSync(link, { recursive: true, force: true });
  } catch (_) {
    /* not present yet */
  }
  fs.symlinkSync(target, link, linkType);
  console.log(`[link-shared] linked @shieldguard/shared -> ${app}`);
}

console.log('[link-shared] done. Edits to shared/ propagate to all apps live.');
