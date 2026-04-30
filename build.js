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

const targetFiles = [
  'index.html',
  'compare/index.html',
  'rewards/index.html',
  'debt-planner/index.html',
  'min-payment/index.html',
  'score-simulator/index.html',
  'af-worth-it/index.html',
  'loan-vs-bt/index.html',
  'cards/index.html',
  'cards/chase-sapphire-preferred/index.html',
  'cards/amex-gold/index.html',
  'cards/capital-one-venture-x/index.html',
  'blog/index.html',
  'disclosure.html',
  'learn/index.html',
  'learn/pay-off-10k-debt.html',
  'learn/bnpl-interest-calculator.html',
  'learn/balance-transfer-calculator.html',
  'learn/crypto-credit-card-rewards.html',
  'learn/snowball-vs-avalanche.html',
  'merchant/index.html',
  'merchant/amazon.html',
  'merchant/costco.html',
  'merchant/target.html',
  'merchant/walmart.html',
  'merchant/groceries.html',
  'merchant/home-improvement.html',
  'merchant/gas-stations.html',
  'merchant/restaurants.html',
  'merchant/streaming.html',
  'merchant/travel.html'
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