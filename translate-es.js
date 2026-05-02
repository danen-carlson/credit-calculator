/**
 * translate-es.js
 * Applies Spanish translations to all /es/ HTML files.
 * Run: node translate-es.js
 */

const fs = require('fs');
const path = require('path');

const esDir = path.join(__dirname, 'es');

// Common substitutions applied to ALL es/ HTML files
const GLOBAL_SUBS = [
  // Nav (already handled by build, but catch any remaining)
  [/aria-label="Menu"/g, 'aria-label="Menú"'],
  [/aria-label="Select language"/g, 'aria-label="Seleccionar idioma"'],
  [/<span class="current-lang">EN<\/span>/g, '<span class="current-lang">ES</span>'],
  [/>Skip to main content</g, '>Saltar al contenido principal<'],
  
  // Common UI strings
  [/aria-label="Expand payment options"/g, 'aria-label="Expandir opciones de pago"'],
  [/aria-label="Collapse payment options"/g, 'aria-label="Colapsar opciones de pago"'],
  [/aria-label="Add custom card or service"/g, 'aria-label="Agregar tarjeta o servicio personalizado"'],
  [/aria-label="Cancel adding custom card"/g, 'aria-label="Cancelar agregar tarjeta personalizada"'],
  
  // Credit score options
  [/>Excellent \(720\+\)</g, '>Excelente (720+)<'],
  [/>Good \(670–719\)</g, '>Bueno (670–719)<'],
  [/>Fair \(580–669\)</g, '>Regular (580–669)<'],
  [/>Poor \(below 580\)</g, '>Malo (menos de 580)<'],
  [/>Not sure</g, '>No estoy seguro/a<'],

  // Purchase category options (common in compare page)  
  [/>Everything Else</g, '>Todo lo demás<'],
  [/>Groceries</g, '>Supermercado<'],
  [/>Dining</g, '>Restaurantes<'],
  [/>Gas</g, '>Gasolina<'],
  [/>Travel</g, '>Viajes<'],
  [/>Online Shopping</g, '>Compras en Línea<'],
  [/>Streaming</g, '>Streaming<'],
  [/>Utilities</g, '>Servicios Públicos<'],
  
  // Footer links
  [/>Affiliate Disclosure</g, '>Divulgación de Afiliados<'],
  [/CreditStud\.io is for informational purposes only\. Actual rates, terms, and eligibility may vary\./g, 
   'CreditStud.io es solo para fines informativos. Las tasas, términos y elegibilidad reales pueden variar.'],
];

// Per-file translations (key = relative path, value = array of [regex, replacement])
const FILE_SUBS = {};

function applyGlobal(content) {
  for (const [regex, replacement] of GLOBAL_SUBS) {
    content = content.replace(regex, replacement);
  }
  return content;
}

// Find all HTML files in es/
function findHtmlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = findHtmlFiles(esDir);
let updated = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  content = applyGlobal(content);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated: ${path.relative(esDir, filePath)}`);
    updated++;
  }
}

console.log(`\nDone: ${updated} files updated.`);
