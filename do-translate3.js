#!/usr/bin/env node
/**
 * Third pass - fix regex escaping issues and remaining content
 */

const fs = require('fs');
const path = require('path');

// Read each file and apply fixes
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

function fixContent(content) {
  let result = content;
  
  // Fix "📊 Example: Ejemplo: " -> "📊 Ejemplo: "
  result = result.replace(/(<h3>📊 )Example: Ejemplo: /g, '$1Ejemplo: ');
  
  // Fix Créditos Anuales with broken dollar amounts
  // "$50 total face value" was matched but $50 became $2 (group 2)
  // We need to fix the Annual Credits section heading
  result = result.replace(/<h2><span class="icon">💰<\/span> Créditos Anuales \(\$2 valor nominal total\)<\/h2>/g, 
    '<h2><span class="icon">💰</span> Créditos Anuales ($50 valor nominal total)</h2>');
  result = result.replace(/<h2><span class="icon">💰<\/span> Créditos Anuales \(\$([0-9]+) valor nominal total\)<\/h2>/g,
    '<h2><span class="icon">💰</span> Créditos Anuales ($$1 valor nominal total)</h2>');

  // Fix HTML entity issues from regex - broken tags
  result = result.replace(/Bueno a Excelente \(670\+\)\/div>/g, 'Bueno a Excelente (670+)</div>');
  result = result.replace(/>Bueno a Excelente \(670\+\)/g, '>Bueno a Excelente (670+)');
  result = result.replace(/>Excelente \(720\+\)/g, '>Excelente (720+)');
  
  // Fix issuer rules still in English
  result = result.replace(/5\/24 rule: Chase typically denies if you&#39;ve opened 5\+ cards \(any issuer\) in the past 24 months\./g,
    'Regla 5/24: Chase generalmente rechaza si has abierto 5+ tarjetas (cualquier emisor) en los últimos 24 meses.');
  result = result.replace(/5\/24 rule: Chase typically denies if you've opened 5\+ cards \(any issuer\) in the past 24 months\./g,
    'Regla 5/24: Chase generalmente rechaza si has abierto 5+ tarjetas (cualquier emisor) en los últimos 24 meses.');
  
  // Fix math row streaming amounts that got mangled: "$2/mes" patterns
  // Pattern "$2/mes × 12 × Nx" came from regex group $2 replacing number
  // We need to look at context - streaming is $50/mo for CSP
  // These will need to be fixed per-page, let's handle the most common cases
  // The issue is $50/mo became "$2/mes" where $2 was the second capture group
  // The correct format should be $50/mes
  // This is a broader problem - the math row regex used $2 to capture the amount
  // but in regex replacement, $2 means group 2. Let's fix any math rows that have odd amounts
  
  // Fix the specific regex-broken spans in math rows
  // Any span with just dollar sign + single digit + /mes is probably broken
  result = result.replace(/<span>([^<]+): \$([0-9]+)\/mes × 12/g, (m, cat, amt) => {
    // This looks correct already
    return m;
  });
  
  // Fix the "Annual Credits" heading that may still show "$2" from earlier regex issue
  // Look for the credit table to get the actual amount
  result = result.replace(/<h2><span class="icon">💰<\/span> Créditos Anuales \(\$2 valor nominal total\)<\/h2>/g,
    '<h2><span class="icon">💰</span> Créditos Anuales (ver tabla)</h2>');
  
  // Fix breadcrumb "Home" -> "Inicio" for nav links 
  result = result.replace(/(<a href="\/es\/" class="nav-link">)Inicio(<\/a>)/g, '$1Inicio$2');
  
  // Fix meta title translations for common card pages
  result = result.replace(
    /<title>Chase Sapphire Preferred® Card Review — Pros, Cons &amp; Verdict \| CreditStud\.io<\/title>/g,
    '<title>Reseña de la Chase Sapphire Preferred® Card — Pros, Contras y Veredicto | CreditStud.io</title>'
  );
  
  // Fix remaining English FAQ questions in card pages
  result = result.replace(/<summary>Is the Chase Sapphire Preferred worth the \$95 annual fee\?<\/summary>/g,
    '<summary>¿Vale la pena la Chase Sapphire Preferred con la cuota anual de $95?</summary>');
  result = result.replace(/<div class="faq-answer">For most people who travel and dine out, yes\. The \$50 annual hotel credit alone covers more than half the fee, and the 5x travel \/ 3x dining rewards add up fast\. The signup bonus alone \(worth ~\$750 in travel\) covers the fee for ~7 years\.<\/div>/g,
    '<div class="faq-answer">Para la mayoría de las personas que viajan y comen fuera, sí. El crédito anual de hotel de $50 solo cubre más de la mitad de la cuota, y las recompensas 5x en viajes / 3x en restaurantes se acumulan rápidamente. El bono de bienvenida solo (valor de ~$750 en viajes) cubre la cuota por ~7 años.</div>');
  result = result.replace(/<summary>What are Chase Sapphire Preferred points worth\?<\/summary>/g,
    '<summary>¿Cuánto valen los puntos de la Chase Sapphire Preferred?</summary>');
  result = result.replace(/<div class="faq-answer">Points are worth 1\.25¢ each when redeemed for travel through Chase Travel, or 1¢ for cash back\. With Chase&#39;s transfer partners \(Hyatt, United, Southwest, etc\.\), savvy redeemers regularly get 1\.5–2¢\+ per point\.<\/div>/g,
    '<div class="faq-answer">Los puntos valen 1.25¢ cada uno al canjearlos por viajes a través de Chase Travel, o 1¢ en efectivo. Con los socios de transferencia de Chase (Hyatt, United, Southwest, etc.), los canjeadores inteligentes obtienen regularmente 1.5–2¢+ por punto.</div>');
  result = result.replace(/<summary>What credit score do I need for the Chase Sapphire Preferred\?<\/summary>/g,
    '<summary>¿Qué puntaje de crédito necesito para la Chase Sapphire Preferred?</summary>');
  result = result.replace(/<div class="faq-answer">Good to excellent credit \(670\+ FICO\) is recommended\. Chase also enforces the unwritten &quot;5\/24 rule&quot; — if you&#39;ve opened 5 or more credit cards from any issuer in the last 24 months, you&#39;ll likely be denied regardless of score\.<\/div>/g,
    '<div class="faq-answer">Se recomienda crédito bueno a excelente (670+ FICO). Chase también aplica la "regla 5/24" no escrita: si has abierto 5 o más tarjetas de crédito de cualquier emisor en los últimos 24 meses, probablemente serás rechazado independientemente del puntaje.</div>');
  result = result.replace(/<summary>Does the Chase Sapphire Preferred have foreign transaction fees\?<\/summary>/g,
    '<summary>¿La Chase Sapphire Preferred tiene comisiones por transacciones en el extranjero?</summary>');
  result = result.replace(/<div class="faq-answer">No — zero foreign transaction fees, making it a strong choice for international travel\.<\/div>/g,
    '<div class="faq-answer">No — sin comisiones por transacciones internacionales, lo que la convierte en una excelente opción para viajes internacionales.</div>');
  result = result.replace(/<summary>How does the Sapphire Preferred compare to the Reserve\?<\/summary>/g,
    '<summary>¿Cómo se compara la Sapphire Preferred con la Reserve?</summary>');
  result = result.replace(/<div class="faq-answer">The Reserve \(\$545 AF\) adds airport lounge access, \$300 annual travel credit, and 1\.5¢\/point redemption\. The Preferred \(\$95\) is a better value unless you fly enough to use the lounges \(~10\+ flights\/year\) and use the full \$300 credit\.<\/div>/g,
    '<div class="faq-answer">La Reserve ($545 de cuota anual) agrega acceso a salas de aeropuerto, $300 en créditos anuales de viaje y canje de 1.5¢/punto. La Preferred ($95) es mejor valor a menos que vueles suficiente para usar las salas (~10+ vuelos/año) y uses el crédito de $300 completo.</div>');
  result = result.replace(/<summary>Can I downgrade the Sapphire Preferred later\?<\/summary>/g,
    '<summary>¿Puedo hacer downgrade de la Sapphire Preferred después?</summary>');
  result = result.replace(/<div class="faq-answer">Yes\. After year 1, you can downgrade product-change to Chase Freedom Unlimited or Freedom Flex \(no AF\), keeping your account history\. You can&#39;t upgrade back without a new application though\.<\/div>/g,
    '<div class="faq-answer">Sí. Después del año 1, puedes hacer downgrade a Chase Freedom Unlimited o Freedom Flex (sin cuota anual), conservando el historial de tu cuenta. Sin embargo, no puedes volver a subir sin hacer una nueva solicitud.</div>');

  // Fix credits table content (hotel credit description)
  result = result.replace(/\$50 annual hotel credit <span[^>]*>\(Hotels booked through Chase Travel\)<\/span>/g,
    'Crédito anual de $50 para hoteles <span style="color:var(--text-secondary);font-size:0.85rem;">(Hoteles reservados a través de Chase Travel)</span>');
  
  // Fix welcome bonus in p tag
  result = result.replace(/<p style="font-size:1\.05rem;">60,000 points \(worth \$750 in travel\) after \$4,000 spend in 3 months<\/p>/g,
    '<p style="font-size:1.05rem;">60,000 puntos (valor de $750 en viajes) tras gastar $4,000 en 3 meses</p>');

  // Fix math section header
  result = result.replace(/(<h3>📊 )Ejemplo: Typical traveler\/diner(<\/h3>)/g, '$1Ejemplo: Viajero/comensal típico$2');
  result = result.replace(/(<h3>📊 )Example: ([^<]+)(<\/h3>)/g, '$1Ejemplo: $2$3');
  
  // Fix common math row patterns - they may still have English amounts
  result = result.replace(/Streaming: \$50\/mo × 12 × 3x/g, 'Streaming: $50/mes × 12 × 3x');
  result = result.replace(/Streaming: \$2\/mes × 12 × 3x/g, 'Streaming: $50/mes × 12 × 3x');
  result = result.replace(/([A-Za-z ]+): \$(\d+)\/mo × 12 × (\d+)x/g, (m, cat, amt, mult) => {
    const catMap = {
      'Dining': 'Restaurantes',
      'Travel': 'Viajes', 
      'Groceries': 'Supermercados',
      'Gas': 'Gasolina',
      'Gas stations': 'Gasolineras',
      'Streaming': 'Streaming',
      'Online groceries': 'Supermercados en línea',
      'Other travel': 'Otros viajes',
      'Everything else': 'Todo lo demás',
      'Amazon & Whole Foods': 'Amazon y Whole Foods',
      'Rent': 'Alquiler',
      'Uber & Uber Eats': 'Uber y Uber Eats',
      'IHG hotels': 'Hoteles IHG',
      'Southwest purchases': 'Compras en Southwest',
    };
    const esCat = catMap[cat.trim()] || cat;
    return `${esCat}: $${amt}/mes × 12 × ${mult}x`;
  });
  
  return result;
}

const files = getAllHtmlFiles(BASE_DIR);
let processed = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let fixed = fixContent(content);
  
  if (fixed !== content) {
    fs.writeFileSync(file, fixed, 'utf8');
    processed++;
  }
}

console.log(`Done! Fixed ${processed}/${files.length} files.`);
