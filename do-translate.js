#!/usr/bin/env node
/**
 * Comprehensive Spanish translation script for CreditStud.io
 * Translates common patterns across all es/ pages
 */

const fs = require('fs');
const path = require('path');

// Common text substitutions to apply to all pages
const commonReplacements = [
  // Nav items
  [/(<a href="\/es\/" class="nav-link">)Home(<\/a>)/g, '$1Inicio$2'],
  [/(class="nav-dropdown-toggle"[^>]*>\s*)Calculators( ▾\s*<\/button>)/g, '$1Calculadoras$2'],
  [/(<span class="nav-dropdown-heading">)Card Comparison(<\/span>)/g, '$1Comparación de Tarjetas$2'],
  [/(<span class="nav-dropdown-heading">)Debt &amp; Payoff(<\/span>)/g, '$1Deudas y Pagos$2'],
  [/(<span class="nav-dropdown-heading">)Card Finder(<\/span>)/g, '$1Buscador de Tarjetas$2'],
  [/(<a href="\/es\/compare\/" class="nav-dropdown-link">)Compare Credit Cards &amp; BNPL(<\/a>)/g, '$1Compara Tarjetas de Crédito y BNPL$2'],
  [/(<a href="\/es\/rewards\/" class="nav-dropdown-link">)Rewards Calculator(<\/a>)/g, '$1Calculadora de Recompensas$2'],
  [/(<a href="\/es\/cards\/" class="nav-dropdown-link">)Card Reviews(<\/a>)/g, '$1Reseñas de Tarjetas$2'],
  [/(<a href="\/es\/debt-planner\/" class="nav-dropdown-link">)Debt Payoff Planner(<\/a>)/g, '$1Planificador de Pago de Deudas$2'],
  [/(<a href="\/es\/min-payment\/" class="nav-dropdown-link">)Minimum Payment Calculator(<\/a>)/g, '$1Calculadora de Pago Mínimo$2'],
  [/(<a href="\/es\/loan-vs-bt\/" class="nav-dropdown-link">)Loan vs Balance Transfer(<\/a>)/g, '$1Préstamo vs Transferencia de Saldo$2'],
  [/(<a href="\/es\/af-worth-it\/" class="nav-dropdown-link">)Annual Fee Calculator(<\/a>)/g, '$1Calculadora de Cuota Anual$2'],
  [/(<a href="\/es\/score-simulator\/" class="nav-dropdown-link">)Credit Score Simulator(<\/a>)/g, '$1Simulador de Puntaje de Crédito$2'],
  [/(<a href="\/es\/learn\/" class="nav-link">)Learn(<\/a>)/g, '$1Aprende$2'],
  [/(<a href="\/es\/blog\/" class="nav-link">)Blog(<\/a>)/g, '$1Blog$2'],
  
  // Disclosure banner
  [/CreditStud\.io may earn commissions from credit card applications through affiliate links\. This does not affect our rankings or recommendations\.\s*\n\s*(<a href="\/es\/disclosure\.html">)Learn more(<\/a>)/g, 
   'CreditStud.io puede ganar comisiones por solicitudes de tarjetas de crédito a través de enlaces de afiliados. Esto no afecta nuestras clasificaciones ni recomendaciones. \n      $1Más información$2'],
  
  // Footer
  [/CreditStud\.io is for informational purposes only\. Actual rates, terms, and eligibility may vary\./g, 
   'CreditStud.io es solo para fines informativos. Las tasas, términos y elegibilidad reales pueden variar.'],
  [/(<a href="\/es\/disclosure\.html">)Affiliate Disclosure(<\/a>)/g, '$1Divulgación de Afiliados$2'],
  
  // Card hero stats
  [/(<div class="stat-label">)Annual fee(<\/div>)/g, '$1Cuota anual$2'],
  [/(<div class="stat-label">)Welcome bonus(<\/div>)/g, '$1Bono de bienvenida$2'],
  [/(<div class="stat-label">)Intro APR(<\/div>)/g, '$1APR Introductorio$2'],
  [/(<div class="stat-label">)Reg\. APR(<\/div>)/g, '$1APR Regular$2'],
  
  // Card review sections
  [/(<h2>)Quick verdict(<\/h2>)/g, '$1Veredicto rápido$2'],
  [/(<div class="rating-label">)Rewards(<\/div>)/g, '$1Recompensas$2'],
  [/(<div class="rating-label">)Perks(<\/div>)/g, '$1Beneficios$2'],
  [/(<div class="rating-label">)AF Value(<\/div>)/g, '$1Valor de Cuota Anual$2'],
  [/(<div class="rating-label">)Approval Ease(<\/div>)/g, '$1Facilidad de Aprobación$2'],
  [/(<div class="rating-label">)Overall(<\/div>)/g, '$1General$2'],
  [/(<h2><span class="icon">🎁<\/span> )Welcome bonus(<\/h2>)/g, '$1Bono de bienvenida$2'],
  [/(<h2><span class="icon">⚡<\/span> )Rewards(<\/h2>)/g, '$1Recompensas$2'],
  [/(<h2><span class="icon">✨<\/span> )Perks(<\/h2>)/g, '$1Beneficios$2'],
  [/(<h2><span class="icon">🎯<\/span> )Who should consider this card(<\/h2>)/g, '$1¿Quién debería considerar esta tarjeta?$2'],
  [/(<h2><span class="icon">📋<\/span> )Application tips(<\/h2>)/g, '$1Consejos para la solicitud$2'],
  [/(<h2><span class="icon">⚖️<\/span> )Compare to similar cards(<\/h2>)/g, '$1Compara con tarjetas similares$2'],
  [/(<h2><span class="icon">❓<\/span> )Frequently asked questions(<\/h2>)/g, '$1Preguntas frecuentes$2'],
  [/(<h2><span class="icon">💰<\/span> Annual Credits \()(\$[0-9]+ total face value)(\)<\/h2>)/g, 
   '$1Créditos Anuales ($2 valor nominal)$3'],
  // Generic pattern for credits section
  [/(<h2><span class="icon">💰<\/span> )Annual Credits \(([^)]+)\)(<\/h2>)/g, 
   '$1Créditos Anuales ($2)$3'],

  // Rewards table headers
  [/(<th>)Category(<\/th>)/g, '$1Categoría$2'],
  [/(<th>)Rate(<\/th>)/g, '$1Tasa$2'],
  [/(<th>)Type(<\/th>)/g, '$1Tipo$2'],
  
  // Common reward category cells
  [/(<td>)Dining(<\/td>)/g, '$1Restaurantes$2'],
  [/(<td>)Travel \(Chase portal\)(<\/td>)/g, '$1Viajes (portal Chase)$2'],
  [/(<td>)Streaming(<\/td>)/g, '$1Streaming$2'],
  [/(<td>)Online groceries(<\/td>)/g, '$1Supermercados en línea$2'],
  [/(<td>)Other travel(<\/td>)/g, '$1Otros viajes$2'],
  [/(<td>)Everything else(<\/td>)/g, '$1Todo lo demás$2'],
  [/(<td>)Groceries(<\/td>)/g, '$1Supermercados$2'],
  [/(<td>)Gas(<\/td>)/g, '$1Gasolina$2'],
  [/(<td>)Gas stations(<\/td>)/g, '$1Gasolineras$2'],
  [/(<td>)Transit(<\/td>)/g, '$1Transporte$2'],
  [/(<td>)Entertainment(<\/td>)/g, '$1Entretenimiento$2'],
  [/(<td>)Hotels via Capital One Travel(<\/td>)/g, '$1Hoteles vía Capital One Travel$2'],
  [/(<td>)Airbnb &amp; hotels(<\/td>)/g, '$1Airbnb y hoteles$2'],
  [/(<td>)Flights via Capital One Travel(<\/td>)/g, '$1Vuelos vía Capital One Travel$2'],
  [/(<td>)All other travel(<\/td>)/g, '$1Todos los demás viajes$2'],
  [/(<td>)All other purchases(<\/td>)/g, '$1Todas las demás compras$2'],
  [/(<td>)Rent payments(<\/td>)/g, '$1Pagos de alquiler$2'],
  [/(<td>)Amazon &amp; Whole Foods(<\/td>)/g, '$1Amazon y Whole Foods$2'],
  [/(<td>)Apple Pay(<\/td>)/g, '$1Apple Pay$2'],
  [/(<td>)Non-Apple Pay(<\/td>)/g, '$1Sin Apple Pay$2'],
  [/(<td>)Uber &amp; Uber Eats(<\/td>)/g, '$1Uber y Uber Eats$2'],
  [/(<td>)Other Uber purchases(<\/td>)/g, '$1Otras compras en Uber$2'],
  [/(<td>)IHG hotels(<\/td>)/g, '$1Hoteles IHG$2'],
  [/(<td>)Southwest purchases(<\/td>)/g, '$1Compras en Southwest$2'],
  [/(<td>)U\.S\. supermarkets \(up to \$6,000\/year\)(<\/td>)/g, '$1Supermercados en EE.UU. (hasta $6,000/año)$2'],
  [/(<td>)U\.S\. supermarkets \(up to \$6,000\/yr\)(<\/td>)/g, '$1Supermercados en EE.UU. (hasta $6,000/año)$2'],
  [/(<td>)U\.S\. supermarkets(<\/td>)/g, '$1Supermercados en EE.UU.$2'],
  [/(<td>)U\.S\. gas stations(<\/td>)/g, '$1Gasolineras en EE.UU.$2'],
  [/(<td>)U\.S\. gas stations \(up to \$6,000\/year\)(<\/td>)/g, '$1Gasolineras en EE.UU. (hasta $6,000/año)$2'],
  [/(<td>)Streaming \(U\.S\.\)(<\/td>)/g, '$1Streaming (EE.UU.)$2'],
  [/(<td>)Transit \(Citi\)(<\/td>)/g, '$1Transporte (Citi)$2'],
  [/(<td>)Hotels \(Amex Travel\)(<\/td>)/g, '$1Hoteles (Amex Travel)$2'],
  [/(<td>)Airfare \(Amex Travel\)(<\/td>)/g, '$1Vuelos (Amex Travel)$2'],
  [/(<td>)Dining \(worldwide\)(<\/td>)/g, '$1Restaurantes (global)$2'],
  [/(<td>)Dining at Amex restaurants(<\/td>)/g, '$1Restaurantes Amex$2'],
  [/(<td>)Airline purchases(<\/td>)/g, '$1Compras de aerolínea$2'],
  [/(<td>)Hotel purchases(<\/td>)/g, '$1Compras de hotel$2'],
  [/(<td>)cash back(<\/td>)/g, '$1cash back$2'],
  [/(<td>)miles(<\/td>)/g, '$1millas$2'],
  [/(<td>)points(<\/td>)/g, '$1puntos$2'],

  // Credits table
  [/Credit value depends on you actually using them\. Many credits are split monthly or semi-annually, so factor in your usage habits before counting them against the AF\./g,
   'El valor de los créditos depende de que realmente los uses. Muchos créditos se dividen mensualmente o semestralmente, así que considera tus hábitos de uso antes de contarlos contra la cuota anual.'],
  [/Points\/miles valued at 1\.25¢ each \(CreditStud\.io estimate based on typical travel redemption\)\./g,
   'Puntos/millas valorados en 1.25¢ cada uno (estimación de CreditStud.io basada en canje típico de viajes).'],
  
  // Fit blocks
  [/(<h3>)✅ Best for(<\/h3>)/g, '$1✅ Ideal para$2'],
  [/(<h3>)❌ Skip if(<\/h3>)/g, '$1❌ Sáltate si$2'],
  
  // Application tips
  [/(<div class="tip-label">)Credit needed(<\/div>)/g, '$1Crédito requerido$2'],
  [/(<div class="tip-label">)Issuer rules(<\/div>)/g, '$1Reglas del emisor$2'],
  [/>Good to Excellent \(670\+\)</g, '>Bueno a Excelente (670+)'],
  [/>Good to excellent credit \(670\+ FICO\) is recommended\./g, '>Se recomienda crédito bueno a excelente (670+ FICO).'],
  [/Not sure if you'll qualify\? Try our <a href="\/es\/score-simulator\/">credit score simulator<\/a> to see what rate range you might fall into\./g,
   '¿No estás seguro de si calificarás? Prueba nuestro <a href="/es/score-simulator/">simulador de puntaje de crédito</a> para ver en qué rango de tasa podrías estar.'],
  
  // Compare section
  [/(<div class="compare-link">)Read review →(<\/div>)/g, '$1Leer reseña →$2'],
  [/(<p[^>]*><a href="\/es\/compare\/">)Side-by-side comparison tool →(<\/a><\/p>)/g, '$1Herramienta de comparación lado a lado →$2'],
  
  // CTA bar
  [/(<h2>)Ready to apply\?(<\/h2>)/g, '$1¿Listo para solicitar?$2'],
  [/Application takes 5 minutes\. Approval decision typically instant for qualified applicants\./g,
   'La solicitud tarda 5 minutos. La decisión de aprobación es típicamente instantánea para los solicitantes calificados.'],
  [/(<a href="#" class="btn-apply"[^>]*>)Apply at ([A-Za-z ]+)( →<\/a>)/g, '$1Solicita en $2$3'],
  [/(<a href="#" class="btn-apply-hero"[^>]*>)Apply at ([A-Za-z ]+)( →<\/a>)/g, '$1Solicita en $2$3'],
  
  // Review meta
  [/Reviewed by CreditStud\.io editorial team • Last updated/g, 'Revisado por el equipo editorial de CreditStud.io • Actualizado'],
  [/(<a href="\/es\/disclosure\.html">)Methodology &amp; disclosure(<\/a>)/g, '$1Metodología y divulgación$2'],
  
  // Math example section title
  [/(<h3>📊 Example: )/g, '$1Ejemplo: '],
  [/(value)\n/g, '$1\n'],
  
  // Based on illustrative spending
  [/Based on illustrative spending\. Use our <a href="\/es\/af-worth-it\/">AF Worth It Calculator<\/a> to plug in your real numbers\./g,
   'Basado en gastos ilustrativos. Usa nuestra <a href="/es/af-worth-it/">Calculadora de Valor de Cuota Anual</a> para ingresar tus números reales.'],
  
  // Math rows common phrases
  [/\+ Annual credits \(full use\)/g, '+ Créditos anuales (uso completo)'],
  [/– Annual fee/g, '– Cuota anual'],
  [/Net annual value/g, 'Valor neto anual'],
  
  // Blog page common elements
  [/(<a href="\/es\/blog\/" class="breadcrumb-link">)Blog(<\/a>)/g, '$1Blog$2'],
  [/(<span class="breadcrumb-current">)([^<]+)(<\/span>)/g, '$1$2$3'], // keep current breadcrumb as-is
  
  // Footer blog links
  [/(<a href="\/es\/blog\/">)Latest Articles(<\/a>)/g, '$1Últimos Artículos$2'],
  [/(<a href="\/es\/learn\/">)All Guides(<\/a>)/g, '$1Todas las Guías$2'],
  
  // Common footer/disclosure patterns
  [/(<a href="\/es\/disclosure\.html">)Methodology &amp; Disclosure(<\/a>)/g, '$1Metodología y Divulgación$2'],
  [/(<a href="\/es\/disclosure\.html">)Learn more(<\/a>)/g, '$1Más información$2'],
  
  // Calculator pages common
  [/(<h1[^>]*>)Debt Payoff Planner(<\/h1>)/g, '$1Planificador de Pago de Deudas$2'],
  [/(<h1[^>]*>)Minimum Payment Calculator(<\/h1>)/g, '$1Calculadora de Pago Mínimo$2'],
  [/(<h1[^>]*>)Rewards Calculator(<\/h1>)/g, '$1Calculadora de Recompensas$2'],
  [/(<h1[^>]*>)Credit Score Simulator(<\/h1>)/g, '$1Simulador de Puntaje de Crédito$2'],
  [/(<h1[^>]*>)Annual Fee Worth It\?(<\/h1>)/g, '$1¿Vale la pena la Cuota Anual?$2'],
  
  // Tools page
  [/(<a href="\/es\/tools\/api\.html">)API Documentation(<\/a>)/g, '$1Documentación API$2'],

  // Learn more link
  [/(<a href="\/es\/disclosure\.html" class="[^"]*">)Learn more(<\/a>)/g, '$1Más información$2'],
];

// Page-specific translations for card pages
const cardPageTranslations = {
  // Common card page text that appears across all card reviews
  common: [
    // Specific math row translations based on common spending categories
    [/(<span>)Travel \(Chase portal\): /g, '$1Viajes (portal Chase): '],
    [/(<span>)Dining: /g, '$1Restaurantes: '],
    [/(<span>)Streaming: /g, '$1Streaming: '],
    [/(<span>)Online groceries: /g, '$1Supermercados en línea: '],
    [/(<span>)Other travel: /g, '$1Otros viajes: '],
    [/(<span>)Everything else: /g, '$1Todo lo demás: '],
    [/(<span>) value(<\/span>)/g, '$1 valor$2'],
    
    // FAQ breadcrumb
    [/("name": ")Home(")/g, '$1Inicio$2'],
    [/("name": ")Credit Cards(")/g, '$1Tarjetas de Crédito$2'],
    [/("name": ")Learn(")/g, '$1Aprende$2'],
    [/("name": ")Blog(")/g, '$1Blog$2'],
  ]
};

function applyTranslations(content, replacements) {
  let result = content;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Get list of files to process
const BASE_DIR = path.join(__dirname, 'es');

function getAllHtmlFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllHtmlFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllHtmlFiles(BASE_DIR);
let processed = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let translated = applyTranslations(content, commonReplacements);
  
  // Apply card-specific translations for card pages
  if (file.includes('/cards/')) {
    translated = applyTranslations(translated, cardPageTranslations.common);
  }
  
  if (translated !== content) {
    fs.writeFileSync(file, translated, 'utf8');
    processed++;
    console.log(`Processed: ${path.relative(__dirname, file)}`);
  }
}

console.log(`\nDone! Processed ${processed}/${files.length} files.`);
