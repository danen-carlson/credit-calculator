#!/usr/bin/env node
/**
 * Clean up duplicate/in-page nav links from CreditStud.io pages.
 * 
 * Some pages had an extra set of nav links inside the header that were
 * written inline (not managed by the header partial). This script removes them.
 */

const fs = require('fs');
const path = require('path');
const repoDir = __dirname;

// Find all HTML files
function findHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const htmlFiles = findHtmlFiles(repoDir);
let changed = 0;

for (const filePath of htmlFiles) {
  let html = fs.readFileSync(filePath, 'utf8');
  let original = html;
  
  // Remove the old inline nav links that appear INSIDE the header but OUTSIDE the partial markers
  // Pattern: pages like min-payment have extra <a href="/..." class="nav-link active">... lines
  // These are the ones that come after the main nav links
  
  // Remove lines that have old-style nav-link items that aren't in the new dropdown structure
  // Look for duplicate nav-link lines like "Min Payment", "Score Sim", "AF Worth It?", "Loan vs BT"
  // that appear as plain <a> tags (not inside nav-dropdown-menu)
  
  // Pattern 1: Remove old-style flat nav links for tools (they're now in the dropdown)
  const oldToolLinks = [
    /<a href="\/min-payment\/" class="nav-link[^"]*">Min Payment<\/a>\n?/g,
    /<a href="\/min-payment\/" class="nav-link[^"]*">Minimum Payment<\/a>\n?/g,
    /<a href="\/score-simulator\/" class="nav-link[^"]*">Score Sim<\/a>\n?/g,
    /<a href="\/score-simulator\/" class="nav-link[^"]*">Credit Score Simulator<\/a>\n?/g,
    /<a href="\/af-worth-it\/" class="nav-link[^"]*">AF Worth It\?<\/a>\n?/g,
    /<a href="\/af-worth-it\/" class="nav-link[^"]*">Annual Fee Calculator<\/a>\n?/g,
    /<a href="\/loan-vs-bt\/" class="nav-link[^"]*">Loan vs BT<\/a>\n?/g,
    /<a href="\/loan-vs-bt\/" class="nav-link[^"]*">Loan vs Balance Transfer<\/a>\n?/g,
    /<a href="\/cards\/" class="nav-link[^"]*">Card Reviews<\/a>\n?/g,
  ];
  
  for (const pattern of oldToolLinks) {
    // Only remove if NOT inside a nav-dropdown-menu div
    // We need to be careful: remove lines that are standalone <a> tags for these tools
    // but keep ones inside nav-dropdown-menu
    const lines = html.split('\n');
    const newLines = [];
    let insideDropdown = false;
    for (const line of lines) {
      if (line.includes('nav-dropdown-menu')) insideDropdown = true;
      if (line.includes('</div>') && insideDropdown && !line.includes('nav-dropdown-link')) insideDropdown = false;
      
      if (!insideDropdown && pattern.source) {
        // Check if this line matches the old nav link pattern (outside dropdown)
        const tempPattern = new RegExp(pattern.source.replace(/\n?/g, ''));
        if (tempPattern.test(line)) {
          // Skip this line — it's an old nav link outside the dropdown
          continue;
        }
      }
      newLines.push(line);
    }
    html = newLines.join('\n');
  }
  
  // Clean up extra blank lines
  html = html.replace(/\n{3,}/g, '\n\n');
  
  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    const relPath = path.relative(repoDir, filePath);
    console.log(`Cleaned ${relPath}`);
    changed++;
  }
}

// Also fix the "active" nav-link items — remove them from pages that have them inline
// since the JS in the footer handles active state automatically
for (const filePath of htmlFiles) {
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;
  
  // Remove class="nav-link active" outside of dropdown-menu (the JS handles this now)
  // But keep it inside dropdown-menu
  const lines = html.split('\n');
  const newLines = [];
  let insideDropdown = false;
  for (const line of lines) {
    if (line.includes('nav-dropdown-menu')) insideDropdown = true;
    if (line.includes('</div>') && insideDropdown) insideDropdown = false;
    
    if (!insideDropdown && line.includes('class="nav-link active"')) {
      continue; // Remove this line
    }
    newLines.push(line);
  }
  html = newLines.join('\n');
  html = html.replace(/\n{3,}/g, '\n\n');
  
  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    const relPath = path.relative(repoDir, filePath);
    console.log(`Removed active class: ${relPath}`);
    changed++;
  }
}

console.log(`\nDone. ${changed} files cleaned.`);