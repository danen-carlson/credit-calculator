const fs = require('fs');
const path = require('path');

const repoDir = __dirname;
const sharedDir = path.join(repoDir, 'shared');

const partials = {
  header: fs.readFileSync(path.join(sharedDir, 'header.html'), 'utf8').trim(),
  footer: fs.readFileSync(path.join(sharedDir, 'footer.html'), 'utf8').trim(),
  disclosure: fs.readFileSync(path.join(sharedDir, 'disclosure-banner.html'), 'utf8').trim()
};

const targetFiles = [
  'index.html',
  'rewards/index.html',
  'debt-planner/index.html',
  'blog/index.html',
  'disclosure.html'
];

for (const relPath of targetFiles) {
  const filePath = path.join(repoDir, relPath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace between comment markers (idempotent)
  for (const [name, partial] of Object.entries(partials)) {
    const start = `<!-- ${name.toUpperCase()} -->`;
    const end = `<!-- /${name.toUpperCase()} -->`;
    const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, 'i');
    if (regex.test(content)) {
      content = content.replace(regex, `${start}\n${partial}\n${end}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}

console.log('\nBuild complete. Edit partials in shared/ then re-run to propagate.');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}