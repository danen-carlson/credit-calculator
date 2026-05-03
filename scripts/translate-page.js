#!/usr/bin/env node
// translate-page.js — Translates a single HTML page from English to Spanish
// Usage: node scripts/translate-page.js <es/file.html> [--dry-run]
//
// This script extracts translatable text from an HTML file, sends it to
// Venice's Claude Sonnet 4.6 for translation, and writes the translations back.

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const VENICE_API_KEY = process.env.VENICE_API_KEY || fs.readFileSync(path.join(process.env.HOME || '/root', '.openclaw/.env'), 'utf8').match(/VENICE_API_KEY=(.+)/)?.[1];
const VENICE_MODEL = 'claude-sonnet-4-6';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node translate-page.js <es/file.html> [--dry-run]');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Extract translatable segments using regex
// We look for text inside HTML tags that appears to be English
const segments = [];
let segId = 0;

// Translation rules for the prompt
const RULES = `
You are translating web content for CreditStud.io from English to US Spanish.
Rules:
- NEVER translate: card names (Chase Sapphire Preferred, Amex Gold, etc.), bank names (Chase, Citi, Capital One), BNPL names (Klarna, Afterpay, Affirm), FICO, VantageScore
- Keep APR, BNPL, cash back in English
- Keep dollar amounts ($XX), percentages (XX%), and numbers exactly as written
- Use US Spanish: "puntaje de crédito", "transferencia de saldo", "cuota anual", "pago mínimo"
- "debt snowball" → "bola de nieve", "debt avalanche" → "avalancha"
- Preserve ALL HTML tags, classes, IDs, data attributes exactly
- Preserve all URLs and href values
- Translate text content between tags, attributes like content= in meta tags
- For JSON-LD: translate "name", "description", "text", "headline" fields, keep @type, @id, url
- Keep the same tone: helpful, direct, slightly informal

Return ONLY the translated text. No explanations, no markdown, no quotes around it.`;

// Build a batch of segments to translate
const translatablePatterns = [
  // Title tag
  { regex: /<title>(.*?)<\/title>/s, group: 1 },
];

// For each segment, we'll collect the text and build a translation request
const translations = new Map();

// Actually, let's use a simpler approach: send the entire file content and get back the translated version
async function translateContent(content, filePath) {
  const prompt = `${RULES}

Translate the following HTML file content from English to Spanish. The file already has correct HTML structure (hreflang, lang="es", /es/ URLs). You ONLY need to translate the English text content to Spanish.

Write the COMPLETE translated HTML file. Do not truncate or summarize.`;

  const payload = {
    model: VENICE_MODEL,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: content }
    ],
    max_tokens: 16384,
    temperature: 0.3
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'api.venice.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices[0]) {
            resolve(response.choices[0].message.content);
          } else if (response.error) {
            reject(new Error(`Venice API error: ${response.error.message || JSON.stringify(response.error)}`));
          } else {
            reject(new Error(`Unexpected response: ${data.substring(0, 500)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}\n${data.substring(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log(`Translating: ${filePath}`);
  console.log(`File size: ${content.length} bytes, ${content.split('\n').length} lines`);
  
  try {
    const translated = await translateContent(content, filePath);
    
    // Strip markdown code blocks if present
    let result = translated;
    if (result.startsWith('```html')) {
      result = result.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Strip any leading/trailing whitespace
    result = result.trim();
    
    if (dryRun) {
      console.log('\n--- DRY RUN ---');
      console.log(`Would write ${result.length} bytes to ${filePath}`);
      // Check for Spanish indicators
      const spanishChars = (result.match(/[áéíóúñ¿¡]/g) || []).length;
      console.log(`Spanish-accented characters: ${spanishChars}`);
    } else {
      fs.writeFileSync(filePath, result, 'utf8');
      console.log(`\n✅ Written ${result.length} bytes to ${filePath}`);
      
      // Verify
      const spanishChars = (result.match(/[áéíóúñ¿¡]/g) || []).length;
      const titleMatch = result.match(/<title>(.*?)<\/title>/);
      console.log(`Spanish-accented characters: ${spanishChars}`);
      console.log(`Title: ${titleMatch ? titleMatch[1].substring(0, 80) : 'N/A'}`);
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();