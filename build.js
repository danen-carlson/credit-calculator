const fs = require('fs');
const path = require('path');

const repoDir = __dirname;
const sharedDir = path.join(repoDir, 'shared');

const partials = {
  header: fs.readFileSync(path.join(sharedDir, 'header.html'), 'utf8').trim(),
  footer: fs.readFileSync(path.join(sharedDir, 'footer.html'), 'utf8').trim(),
  disclosure: fs.readFileSync(path.join(sharedDir, 'disclosure-banner.html'), 'utf8').trim(),
  emailCaptureCSS: fs.readFileSync(path.join(sharedDir, 'email-capture.css'), 'utf8').trim(),
  ga4: fs.readFileSync(path.join(sharedDir, 'ga4.html'), 'utf8').trim()
};

// Auto-discover all HTML files (except shared/ partials themselves)
function findHtmlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'shared') {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Also include root-level HTML files
const htmlFiles = [...findHtmlFiles(repoDir)].filter(f => !f.includes('/shared/'));
// Deduplicate and sort
const uniqueFiles = [...new Set(htmlFiles)].sort();

let updated = 0;
let skipped = 0;

for (const filePath of uniqueFiles) {
  const relPath = path.relative(repoDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const [name, partial] of Object.entries(partials)) {
    const start = `<!-- ${name.toUpperCase()} -->`;
    const end = `<!-- /${name.toUpperCase()} -->`;
    const startRegex = new RegExp(escapeRegex(start), 'i');
    const endRegex = new RegExp(escapeRegex(end), 'i');

    if (startRegex.test(content) && endRegex.test(content)) {
      // Replace between existing markers
      const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, 'i');
      content = content.replace(regex, `${start}\n${partial}\n${end}`);
    } else if (name === 'header' && startRegex.test(content) && !endRegex.test(content)) {
      // Has start marker but no end marker — replace start marker through </header>
      const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?</header>`, 'i');
      content = content.replace(regex, `${start}\n${partial}\n${end}`);
    } else if (name === 'footer' && startRegex.test(content) && !endRegex.test(content)) {
      // Has start marker but no end marker — replace start marker through </script> that follows footer
      const regex = new RegExp(`${escapeRegex(start)}[\\s\\S]*?</script>\\s*(?=</body>)`, 'i');
      if (regex.test(content)) {
        content = content.replace(regex, `${start}\n${partial}\n${end}`);
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${relPath}`);
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\nBuild complete. ${updated} files updated, ${skipped} unchanged.`);
console.log('Edit partials in shared/ then re-run to propagate.');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}