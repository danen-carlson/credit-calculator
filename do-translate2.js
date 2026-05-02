#!/usr/bin/env node
/**
 * Second pass translation script - fixes issues and translates remaining content
 */

const fs = require('fs');
const path = require('path');

// Targeted fixes and remaining translations
const fixes = [
  // Fix the doubled "Annual Credits" issue
  [/(<h2><span class="icon">💰<\/span> )Annual Credits \(Créditos Anuales \(\$([0-9]+) total face value valor nominal\)\)(<\/h2>)/g, 
   '$1Créditos Anuales ($$2 valor nominal total)$3'],
  [/(<h2><span class="icon">💰<\/span> )Annual Credits \(Créditos Anuales \(([^)]+)\)\)(<\/h2>)/g, 
   '$1Créditos Anuales ($2)$3'],
  // Fix any remaining malformed patterns
  [/Annual Credits \(([^)]+)\)/g, 'Créditos Anuales ($1)'],
  
  // Verdict box translations (card-specific, need general patterns)
  // Chase Sapphire Preferred
  [/Best for travelers who book 1–3 trips\/year\. Skip if you rarely travel or dine out, or want simple flat-rate cash back\./g,
   'Ideal para viajeros que reservan 1–3 viajes al año. No la tomes si rara vez viajas o comes fuera, o si quieres un simple cash back de tasa fija.'],
  
  // Welcome bonus patterns
  [/60,000 points \(worth \$750 in travel\) after \$4,000 spend in 3 months/g,
   '60,000 puntos (valor de $750 en viajes) tras gastar $4,000 en 3 meses'],
  [/(\d+),(\d+) points after \$(\d+[,]?\d*) spend in (\d+) months/g,
   '$1,$2 puntos tras gastar $$3 en $4 meses'],
  [/(\d+),(\d+) miles after \$(\d+[,]?\d*) spend in (\d+) months/g,
   '$1,$2 millas tras gastar $$3 en $4 meses'],
  [/(\d+),(\d+) points \(worth \$(\d+) in travel\) after \$(\d+[,]?\d*) spend in (\d+) months/g,
   '$1,$2 puntos (valor de $$3 en viajes) tras gastar $$4 en $5 meses'],
  [/(\d+)% cash back for the first (\d+) months \(up to \$([0-9,]+) in purchases\)/g,
   '$1% cash back durante los primeros $2 meses (hasta $$3 en compras)'],
  [/(\d+)% cash back in rotating categories \(activate quarterly, up to \$([0-9,]+)\/quarter\)/g,
   '$1% cash back en categorías rotativas (activar trimestralmente, hasta $$2/trimestre)'],

  // Perks translations
  [/<li>Trip delay insurance \(6\+ hours\)<\/li>/g, '<li>Seguro por retraso de viaje (6+ horas)</li>'],
  [/<li>Baggage delay insurance<\/li>/g, '<li>Seguro por retraso de equipaje</li>'],
  [/<li>Primary auto rental collision damage waiver<\/li>/g, '<li>Exención de daños por colisión en alquiler de autos (primaria)</li>'],
  [/<li>No foreign transaction fees<\/li>/g, '<li>Sin comisiones por transacciones en el extranjero</li>'],
  [/<li>DoorDash DashPass \(12 months free\)<\/li>/g, '<li>DoorDash DashPass (12 meses gratis)</li>'],
  [/<li>Instacart\+ membership \(12 months\)<\/li>/g, '<li>Membresía Instacart+ (12 meses)</li>'],
  [/<li>25% bonus when redeeming points for travel through Chase<\/li>/g, '<li>Bono del 25% al canjear puntos por viajes a través de Chase</li>'],
  [/<li>Purchase protection<\/li>/g, '<li>Protección de compras</li>'],
  [/<li>Extended warranty<\/li>/g, '<li>Garantía extendida</li>'],
  [/<li>Cell phone protection<\/li>/g, '<li>Protección para teléfono celular</li>'],
  [/<li>Travel accident insurance<\/li>/g, '<li>Seguro de accidentes de viaje</li>'],
  [/<li>No annual fee<\/li>/g, '<li>Sin cuota anual</li>'],
  [/<li>Global Entry \/ TSA PreCheck credit \(\$100\)<\/li>/g, '<li>Crédito para Global Entry / TSA PreCheck ($100)</li>'],
  [/<li>Airport lounge access \(Priority Pass\)<\/li>/g, '<li>Acceso a salas de aeropuerto (Priority Pass)</li>'],
  [/<li>\$300 annual travel credit<\/li>/g, '<li>Crédito anual de $300 para viajes</li>'],
  [/<li>10x on hotels and rental cars through Chase<\/li>/g, '<li>10x en hoteles y alquiler de autos a través de Chase</li>'],
  [/<li>10x on Chase Dining<\/li>/g, '<li>10x en Chase Dining</li>'],
  [/<li>Rental car insurance<\/li>/g, '<li>Seguro de alquiler de autos</li>'],
  [/<li>Return protection<\/li>/g, '<li>Protección de devoluciones</li>'],
  [/<li>Concierge service<\/li>/g, '<li>Servicio de conserjería</li>'],
  [/<li>No foreign transaction fee<\/li>/g, '<li>Sin comisiones por transacciones internacionales</li>'],
  [/<li>Uber Cash credits<\/li>/g, '<li>Créditos en efectivo de Uber</li>'],
  [/<li>Airline fee credit \(\$200\)<\/li>/g, '<li>Crédito para tarifas de aerolínea ($200)</li>'],
  [/<li>Hotel credit \(\$200\)<\/li>/g, '<li>Crédito para hotel ($200)</li>'],
  [/<li>Saks Fifth Avenue credit \(\$100\)<\/li>/g, '<li>Crédito en Saks Fifth Avenue ($100)</li>'],
  [/<li>Digital entertainment credit \(\$240\)<\/li>/g, '<li>Crédito para entretenimiento digital ($240)</li>'],
  [/<li>Equinox credit \(\$300\)<\/li>/g, '<li>Crédito en Equinox ($300)</li>'],
  [/<li>Walmart\+ credit \(\$155\)<\/li>/g, '<li>Crédito Walmart+ ($155)</li>'],
  [/<li>Global Lounge Collection access<\/li>/g, '<li>Acceso a Global Lounge Collection</li>'],
  [/<li>Fine Hotels \+ Resorts benefits<\/li>/g, '<li>Beneficios en Fine Hotels + Resorts</li>'],
  [/<li>Marriott Gold status<\/li>/g, '<li>Estatus Gold en Marriott</li>'],
  [/<li>Hilton Honors Gold status<\/li>/g, '<li>Estatus Gold en Hilton Honors</li>'],
  [/<li>Car rental insurance<\/li>/g, '<li>Seguro de alquiler de autos</li>'],
  [/<li>Roadside assistance<\/li>/g, '<li>Asistencia en carretera</li>'],
  [/<li>Travel &amp; emergency assistance<\/li>/g, '<li>Asistencia de viaje y emergencias</li>'],
  [/<li>Lost luggage insurance<\/li>/g, '<li>Seguro por pérdida de equipaje</li>'],
  [/<li>Trip cancellation\/interruption insurance<\/li>/g, '<li>Seguro por cancelación/interrupción de viaje</li>'],
  [/<li>Lyft Pink membership<\/li>/g, '<li>Membresía Lyft Pink</li>'],
  [/<li>Peloton Digital membership<\/li>/g, '<li>Membresía Peloton Digital</li>'],
  [/<li>Streaming credits \(Disney\+, ESPN\+\)<\/li>/g, '<li>Créditos de streaming (Disney+, ESPN+)</li>'],
  [/<li>Dining credits<\/li>/g, '<li>Créditos para comidas</li>'],
  [/<li>Lounge access<\/li>/g, '<li>Acceso a salas VIP</li>'],
  [/<li>Statement credits<\/li>/g, '<li>Créditos en estado de cuenta</li>'],
  [/<li>Annual hotel credit<\/li>/g, '<li>Crédito anual para hoteles</li>'],
  [/<li>Annual dining credit<\/li>/g, '<li>Crédito anual para comidas</li>'],
  [/<li>Travel insurance<\/li>/g, '<li>Seguro de viaje</li>'],
  [/<li>Free night award<\/li>/g, '<li>Premio de noche gratis</li>'],
  [/<li>IHG Platinum Elite status<\/li>/g, '<li>Estatus Platinum Elite en IHG</li>'],
  [/<li>Companion certificate<\/li>/g, '<li>Certificado para acompañante</li>'],
  [/<li>EarlyBird check-in<\/li>/g, '<li>Check-in anticipado (EarlyBird)</li>'],
  [/<li>Upgraded boardings \(4\/year\)<\/li>/g, '<li>Embarques de prioridad mejorada (4/año)</li>'],
  [/<li>\$75 annual Southwest travel credit<\/li>/g, '<li>Crédito anual de $75 para viajes en Southwest</li>'],
  [/<li>2,000 bonus tier qualifying points<\/li>/g, '<li>2,000 puntos de calificación de nivel adicionales</li>'],
  [/<li>Cash back as statement credit<\/li>/g, '<li>Cash back como crédito en estado de cuenta</li>'],
  [/<li>Balance transfer offers<\/li>/g, '<li>Ofertas de transferencia de saldo</li>'],
  [/<li>Bilt Rewards program \(no-fee rent payments earn points\)<\/li>/g, '<li>Programa Bilt Rewards (pagos de alquiler sin cargo acumulan puntos)</li>'],
  [/<li>Point transfers to airlines and hotels<\/li>/g, '<li>Transferencia de puntos a aerolíneas y hoteles</li>'],
  [/<li>Lyft benefits<\/li>/g, '<li>Beneficios en Lyft</li>'],
  [/<li>Cashback Match first year<\/li>/g, '<li>Cashback Match el primer año</li>'],
  [/<li>Free FICO score<\/li>/g, '<li>Puntaje FICO gratis</li>'],
  [/<li>No foreign transaction fee — great for international travel<\/li>/g, '<li>Sin comisiones internacionales — ideal para viajes al extranjero</li>'],
  [/<li>Daily cash back directly to Apple Cash<\/li>/g, '<li>Cash back diario directamente en Apple Cash</li>'],
  [/<li>Titanium Apple Card<\/li>/g, '<li>Tarjeta Apple Card de titanio</li>'],
  [/<li>Savings account \(4\.15% APY as of 2026\)<\/li>/g, '<li>Cuenta de ahorros (4.15% APY en 2026)</li>'],
  
  // Fit blocks translations
  [/<li>Travelers who book 1–3 trips\/year<\/li>/g, '<li>Viajeros que reservan 1–3 viajes al año</li>'],
  [/<li>People who eat out regularly<\/li>/g, '<li>Personas que comen fuera regularmente</li>'],
  [/<li>Beginners to the Chase Ultimate Rewards ecosystem<\/li>/g, '<li>Principiantes en el ecosistema Chase Ultimate Rewards</li>'],
  [/<p>You rarely travel or dine out, or want simple flat-rate cash back\.<\/p>/g, '<p>Rara vez viajas o comes fuera, o quieres un simple cash back de tasa fija.</p>'],
  [/<li>Frequent travelers \(5\+ trips\/year\)<\/li>/g, '<li>Viajeros frecuentes (5+ viajes/año)</li>'],
  [/<li>People who want lounge access<\/li>/g, '<li>Personas que desean acceso a salas VIP</li>'],
  [/<li>Those who can use the \$300 travel credit<\/li>/g, '<li>Quienes pueden usar el crédito de $300 en viajes</li>'],
  [/<li>Those who don't travel enough to offset the high AF<\/li>/g, '<li>Quienes no viajan lo suficiente para compensar la alta cuota anual</li>'],
  [/<p>You don't travel enough to justify the \$([0-9]+) annual fee\.<\/p>/g, '<p>No viajas lo suficiente para justificar la cuota anual de $$1.</p>'],
  [/<li>Heavy grocery spenders \(\$400\+\/month at U\.S\. supermarkets\)<\/li>/g, '<li>Grandes gastadores en supermercados ($400+/mes en EE.UU.)</li>'],
  [/<li>Families with large grocery bills<\/li>/g, '<li>Familias con facturas de supermercado elevadas</li>'],
  [/<li>Gas station regulars<\/li>/g, '<li>Personas que llenan el tanque regularmente</li>'],
  [/<li>Those who prefer no annual fee<\/li>/g, '<li>Quienes prefieren no pagar cuota anual</li>'],
  [/<p>You primarily shop at Costco or Walmart \(where this card doesn't earn bonus\)\.<\/p>/g, '<p>Compras principalmente en Costco o Walmart (donde esta tarjeta no gana bonificación).</p>'],
  [/<li>Dining and travel enthusiasts<\/li>/g, '<li>Entusiastas de los restaurantes y viajes</li>'],
  [/<li>Those who want maximum rewards on restaurants<\/li>/g, '<li>Quienes desean el máximo de recompensas en restaurantes</li>'],
  [/<li>People who cook at home mostly<\/li>/g, '<li>Personas que cocinan en casa principalmente</li>'],
  [/<li>Simple cash back seekers<\/li>/g, '<li>Quienes buscan cash back sencillo</li>'],
  [/<li>People who want 2% on everything<\/li>/g, '<li>Personas que quieren 2% en todo</li>'],
  [/<li>Those who want 1\.5% everywhere<\/li>/g, '<li>Quienes quieren 1.5% en todas partes</li>'],
  [/<li>People who want a simple flat-rate card<\/li>/g, '<li>Personas que quieren una tarjeta de tasa fija sencilla</li>'],
  [/<li>First-year cashback maximizers<\/li>/g, '<li>Maximizadores del cash back del primer año</li>'],
  [/<li>Those who activate quarterly categories<\/li>/g, '<li>Quienes activan las categorías trimestrales</li>'],
  [/<p>You can't be bothered to activate categories quarterly\.<\/p>/g, '<p>No te molesta activar categorías trimestralmente.</p>'],
  [/<p>You want a single card that maximizes every category\.<\/p>/g, '<p>Quieres una sola tarjeta que maximice cada categoría.</p>'],
  [/<li>Amazon Prime members<\/li>/g, '<li>Miembros de Amazon Prime</li>'],
  [/<li>People who want no annual fee with solid rewards<\/li>/g, '<li>Personas que quieren sin cuota anual con buenas recompensas</li>'],
  [/<p>You're not an Amazon Prime member \(no Amazon rewards\)\.<\/p>/g, '<p>No eres miembro de Amazon Prime (sin recompensas en Amazon).</p>'],
  [/<li>iPhone users who pay with Apple Pay frequently<\/li>/g, '<li>Usuarios de iPhone que pagan con Apple Pay frecuentemente</li>'],
  [/<li>Those who want daily cash back<\/li>/g, '<li>Quienes desean cash back diario</li>'],
  [/<p>You don't own an iPhone or use Apple Pay\.<\/p>/g, '<p>No tienes iPhone o no usas Apple Pay.</p>'],
  [/<li>Frequent Uber\/Uber Eats users<\/li>/g, '<li>Usuarios frecuentes de Uber/Uber Eats</li>'],
  [/<p>You rarely use Uber or Uber Eats\.<\/p>/g, '<p>Rara vez usas Uber o Uber Eats.</p>'],
  [/<li>IHG hotel loyalists<\/li>/g, '<li>Clientes leales a hoteles IHG</li>'],
  [/<li>Those who stay 5\+ nights per year at IHG properties<\/li>/g, '<li>Quienes se hospedan 5+ noches al año en propiedades IHG</li>'],
  [/<p>You don't stay at IHG hotels\.<\/p>/g, '<p>No te hospedas en hoteles IHG.</p>'],
  [/<li>Southwest frequent flyers<\/li>/g, '<li>Viajeros frecuentes de Southwest</li>'],
  [/<li>Those chasing the Companion Pass<\/li>/g, '<li>Quienes buscan el Companion Pass</li>'],
  [/<p>You don't fly Southwest\.<\/p>/g, '<p>No vuelas con Southwest.</p>'],
  [/<li>Rent payers who want points<\/li>/g, '<li>Inquilinos que quieren acumular puntos</li>'],
  [/<li>Point transfer maximizers<\/li>/g, '<li>Maximizadores de transferencia de puntos</li>'],
  [/<p>You own your home or don't want to manage points\.<\/p>/g, '<p>Eres dueño de tu casa o no quieres gestionar puntos.</p>'],
  [/<li>Those who want simple flat-rate cash back<\/li>/g, '<li>Quienes quieren cash back de tasa fija sencilla</li>'],
  [/<li>People with one main spending category<\/li>/g, '<li>Personas con una categoría principal de gasto</li>'],
  [/<p>Your top category changes frequently\.<\/p>/g, '<p>Tu categoría principal cambia con frecuencia.</p>'],
  [/<li>Heavy Category Users<\/li>/g, '<li>Usuarios de categorías intensivas</li>'],
  [/<li>People who want to choose their bonus categories<\/li>/g, '<li>Personas que quieren elegir sus categorías de bonificación</li>'],
  [/<p>You want a single card that earns well everywhere without activation\.<\/p>/g, '<p>Quieres una tarjeta que gane bien en todas partes sin activación.</p>'],
  [/<li>Costco members<\/li>/g, '<li>Miembros de Costco</li>'],
  [/<li>Frequent Costco shoppers<\/li>/g, '<li>Compradores frecuentes de Costco</li>'],
  [/<p>You don't shop at Costco\.<\/p>/g, '<p>No compras en Costco.</p>'],
  [/<li>People who want high-end travel perks<\/li>/g, '<li>Personas que desean beneficios premium de viaje</li>'],
  [/<li>Business travelers<\/li>/g, '<li>Viajeros de negocios</li>'],
  [/<li>People who rarely travel<\/li>/g, '<li>Personas que viajan raramente</li>'],
  [/<p>You don't travel much or can't use the large credits\.<\/p>/g, '<p>No viajas mucho o no puedes usar los grandes créditos.</p>'],
  [/<li>BofA customers who qualify for Preferred Rewards<\/li>/g, '<li>Clientes de BofA que califican para Preferred Rewards</li>'],
  [/<p>You don't bank with BofA\.<\/p>/g, '<p>No tienes cuenta bancaria en BofA.</p>'],
  [/<li>Wells Fargo customers<\/li>/g, '<li>Clientes de Wells Fargo</li>'],
  [/<li>People who want 3x on multiple categories<\/li>/g, '<li>Personas que quieren 3x en múltiples categorías</li>'],
  [/<p>You want travel transfer partners for maximum points value\.<\/p>/g, '<p>Deseas socios de transferencia de viajes para el máximo valor de puntos.</p>'],
  [/<li>Mid-tier travel card seekers<\/li>/g, '<li>Buscadores de tarjeta de viaje de nivel medio</li>'],
  [/<li>Those who want 3x on four categories<\/li>/g, '<li>Quienes desean 3x en cuatro categorías</li>'],
  [/<p>You want to maximize high-end travel perks like lounge access\.<\/p>/g, '<p>Quieres maximizar beneficios premium de viaje como acceso a salas VIP.</p>'],
  [/<li>Small business owners with shipping\/advertising spend<\/li>/g, '<li>Propietarios de pequeñas empresas con gastos de envío/publicidad</li>'],
  [/<p>You're not a small business owner or don't have qualifying expenses\.<\/p>/g, '<p>No eres propietario de pequeña empresa o no tienes gastos calificados.</p>'],

  // Application tips
  [/5\/24 rule: Chase typically denies if you've opened 5\+ cards \(any issuer\) in the past 24 months\./g,
   'Regla 5/24: Chase generalmente rechaza si has abierto 5+ tarjetas (cualquier emisor) en los últimos 24 meses.'],
  [/>Good to Excellent \(670\+\)</g, '>Bueno a Excelente (670+)'],
  [/>Good-to-Excellent \(670\+\)</g, '>Bueno a Excelente (670+)'],
  [/>Excellent \(720\+\)/g, '>Excelente (720+)'],
  [/>Fair to Good \(580-669\)/g, '>Regular a Bueno (580-669)'],
  [/>Any credit score/g, '>Cualquier puntaje de crédito'],
  [/Amex once-per-lifetime rule: You cannot get the signup bonus if you've held this card before\./g,
   'Regla de Amex una vez en la vida: No puedes obtener el bono de bienvenida si ya has tenido esta tarjeta antes.'],
  [/Amex typically requires good-to-excellent credit\./g,
   'Amex generalmente requiere crédito bueno a excelente.'],
  [/No minimum credit score listed, but typically requires good-to-excellent credit\./g,
   'No hay puntaje mínimo listado, pero típicamente requiere crédito bueno a excelente.'],
  
  // Math examples common patterns
  [/(<span>)Dining: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Restaurantes: $$2/mes × 12 × $3x$4'],
  [/(<span>)Streaming: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Streaming: $$2/mes × 12 × $3x$4'],
  [/(<span>)Online groceries: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Supermercados en línea: $$2/mes × 12 × $3x$4'],
  [/(<span>)Other travel: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Otros viajes: $$2/mes × 12 × $3x$4'],
  [/(<span>)Everything else: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Todo lo demás: $$2/mes × 12 × $3x$4'],
  [/(<span>)Groceries: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Supermercados: $$2/mes × 12 × $3x$4'],
  [/(<span>)Gas: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Gasolina: $$2/mes × 12 × $3x$4'],
  [/(<span>)Gas stations: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Gasolineras: $$2/mes × 12 × $3x$4'],
  [/(<span>)Travel: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Viajes: $$2/mes × 12 × $3x$4'],
  [/(<span>)Hotels via Capital One Travel: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Hoteles vía Capital One Travel: $$2/mes × 12 × $3x$4'],
  [/(<span>)Flights via Capital One Travel: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Vuelos vía Capital One Travel: $$2/mes × 12 × $3x$4'],
  [/(<span>)Uber &amp; Uber Eats: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Uber y Uber Eats: $$2/mes × 12 × $3x$4'],
  [/(<span>)Amazon &amp; Whole Foods: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Amazon y Whole Foods: $$2/mes × 12 × $3x$4'],
  [/(<span>)Apple Pay: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Apple Pay: $$2/mes × 12 × $3x$4'],
  [/(<span>)Non-Apple Pay: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Sin Apple Pay: $$2/mes × 12 × $3x$4'],
  [/(<span>)Rent: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Alquiler: $$2/mes × 12 × $3x$4'],
  [/(<span>)IHG hotels: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Hoteles IHG: $$2/mes × 12 × $3x$4'],
  [/(<span>)Southwest purchases: \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Compras en Southwest: $$2/mes × 12 × $3x$4'],
  [/(<span>)Travel \(Chase portal\): \$(\d+)\/mo × 12 × (\d+)x(<\/span>)/g, '$1Viajes (portal Chase): $$2/mes × 12 × $3x$4'],
  [/ value(<\/span>)/g, ' valor$1'],
  
  // Other common patterns
  [/(<a href="\/es\/disclosure\.html">)Methodology &amp; disclosure(<\/a>)/g, '$1Metodología y divulgación$2'],
  [/Reviewed by CreditStud\.io editorial team • Last updated ([0-9-]+) • /g, 
   'Revisado por el equipo editorial de CreditStud.io • Actualizado $1 • '],
  
  // Blog and article breadcrumbs  
  [/(<a[^>]+>)Home(<\/a>)/g, (m, a, b) => a + 'Inicio' + b],
  
  // Meta tag translations (title and description)
  // These are complex, handle separately per page type
];

function applyFixes(content, replacements) {
  let result = content;
  for (const [pattern, replacement] of replacements) {
    if (typeof replacement === 'function') {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

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
  let translated = applyFixes(content, fixes);
  
  if (translated !== content) {
    fs.writeFileSync(file, translated, 'utf8');
    processed++;
    // console.log(`Fixed: ${path.relative(__dirname, file)}`);
  }
}

console.log(`Done! Fixed ${processed}/${files.length} files.`);
