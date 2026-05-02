#!/usr/bin/env node
/**
 * Fourth pass - fix specific per-card issues and remaining untranslated content
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'es');

// Map of card -> correct Annual Credits amount
const cardCreditAmounts = {
  'chase-sapphire-preferred': '50',
  'capital-one-venture-x': '400',
  'barclays-uber-pro': '120',
  'chase-sapphire-reserve': '450',
  'ihg-one-rewards-premier': '300',
  'chase-freedom-flex': '30',
  'us-bank-altitude-go': '30',
  'citi-strata-premier': '100',
  'amex-platinum': '1,484',
  'citi-premier': '100',
  'amex-gold': '424',
  'southwest-priority-card': '187',
};

// Fix a specific card page
function fixCardPage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract card name from path
  const match = filePath.match(/cards\/([^/]+)\/index\.html$/);
  if (!match) return;
  
  const cardName = match[1];
  const amount = cardCreditAmounts[cardName];
  
  if (amount) {
    // Fix broken "($1 valor nominal total)" -> correct amount
    content = content.replace(
      /Créditos Anuales \(\$1 valor nominal total\)/g,
      `Créditos Anuales ($${amount} valor nominal total)`
    );
  }
  
  // Fix math rows with /mo -> /mes conversion
  content = content.replace(/: \$(\d+)\/mo × 12 × (\d+)x/g, ': $$1/mes × 12 × $2x');
  content = content.replace(/: \$(\d+[,]?\d*)\/mo × 12 × (\d+)x/g, ': $$1/mes × 12 × $2x');
  
  // Fix "value" -> "valor" in spans that got missed
  content = content.replace(/<span>\$([0-9,]+) value<\/span>/g, '<span>$$1 valor</span>');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix all card pages
function getAllCardPages() {
  const cardsDir = path.join(BASE_DIR, 'cards');
  const results = [];
  const items = fs.readdirSync(cardsDir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      const indexPath = path.join(cardsDir, item.name, 'index.html');
      if (fs.existsSync(indexPath)) {
        results.push(indexPath);
      }
    }
  }
  return results;
}

const cardPages = getAllCardPages();
for (const page of cardPages) {
  fixCardPage(page);
}
console.log(`Fixed ${cardPages.length} card pages`);

// Now translate the meta tags and titles for card pages
const cardMetaTranslations = {
  'chase-sapphire-preferred': {
    title: 'Reseña de la Chase Sapphire Preferred® Card — Pros, Contras y Veredicto | CreditStud.io',
    desc: 'Reseña honesta de la Chase Sapphire Preferred® Card. Pros, contras, matemáticas reales y quién debería saltársela. 60,000 puntos (valor de $750 en viajes) tras gastar $4,000 en 3 meses.',
    ogTitle: 'Reseña de la Chase Sapphire Preferred® Card — Pros, Contras y Veredicto | CreditStud.io',
    ogDesc: 'Reseña honesta de la Chase Sapphire Preferred® Card. Pros, contras, matemáticas reales y quién debería saltársela.',
  },
  'chase-sapphire-reserve': {
    title: 'Reseña de la Chase Sapphire Reserve® Card — Pros, Contras y Veredicto | CreditStud.io',
    desc: 'Reseña honesta de la Chase Sapphire Reserve® Card. ¿Vale la pena la cuota de $550? Pros, contras, matemáticas reales y veredicto editorial.',
    ogTitle: 'Reseña de la Chase Sapphire Reserve® Card — Pros, Contras y Veredicto | CreditStud.io',
    ogDesc: 'Reseña honesta de la Chase Sapphire Reserve® Card. ¿Vale la pena la cuota de $550?',
  },
  'amex-gold': {
    title: 'Reseña de la American Express® Gold Card — Pros, Contras y Veredicto | CreditStud.io',
    desc: 'Reseña honesta de la Amex Gold Card. 4x en restaurantes, 4x en supermercados, créditos de $424 en comidas/viajes. ¿Vale la cuota de $325?',
    ogTitle: 'Reseña de la American Express® Gold Card — Pros, Contras y Veredicto | CreditStud.io',
    ogDesc: 'Reseña honesta de la Amex Gold Card. 4x en restaurantes, $424 en créditos, ¿vale la cuota?',
  },
  'amex-platinum': {
    title: 'Reseña de la American Express® Platinum Card — Pros, Contras y Veredicto | CreditStud.io',
    desc: 'Reseña honesta de la Amex Platinum. $695 de cuota anual con $1,484 en créditos potenciales. ¿Vale la pena? Matemáticas reales y veredicto editorial.',
    ogTitle: 'Reseña de la American Express® Platinum Card — Pros, Contras y Veredicto | CreditStud.io',
    ogDesc: 'Reseña honesta de la Amex Platinum. $695 de cuota anual, $1,484 en créditos potenciales. ¿Vale la pena?',
  },
  'amex-blue-cash-preferred': {
    title: 'Reseña de la Blue Cash Preferred® de American Express — Pros, Contras y Veredicto | CreditStud.io',
    desc: 'Reseña honesta de la Amex Blue Cash Preferred. 6% en supermercados, 6% en streaming. ¿Vale la cuota de $95?',
    ogTitle: 'Reseña de la Blue Cash Preferred® de American Express | CreditStud.io',
    ogDesc: '6% en supermercados en EE.UU., 6% en streaming, 3% en gasolina. ¿Vale la cuota de $95?',
  },
  'amex-blue-cash-everyday': {
    title: 'Reseña de la Blue Cash Everyday® de American Express — Sin Cuota Anual | CreditStud.io',
    desc: 'Reseña honesta de la Amex Blue Cash Everyday. 3% en supermercados sin cuota anual. ¿Es mejor que la Preferred?',
    ogTitle: 'Reseña de la Blue Cash Everyday® de American Express | CreditStud.io',
    ogDesc: '3% en supermercados, sin cuota anual. ¿Es mejor que la Preferred para tu bolsillo?',
  },
  'capital-one-venture-x': {
    title: 'Reseña de la Capital One Venture X — Pros, Contras y Veredicto | CreditStud.io',
    desc: 'Reseña honesta de la Capital One Venture X. $395 de cuota, $400 en créditos potenciales, acceso a salas VIP. ¿Vale la pena?',
    ogTitle: 'Reseña de la Capital One Venture X | CreditStud.io',
    ogDesc: '$395 de cuota con $400 en créditos, 10x en hoteles, acceso a salas VIP. ¿Vale la pena?',
  },
  'capital-one-quicksilver': {
    title: 'Reseña de la Capital One Quicksilver — Cash Back Sin Complicaciones | CreditStud.io',
    desc: '1.5% de cash back en todas las compras, sin cuota anual. Reseña honesta de la Capital One Quicksilver.',
    ogTitle: 'Reseña de la Capital One Quicksilver | CreditStud.io',
    ogDesc: '1.5% de cash back en todas las compras, sin cuota anual.',
  },
  'capital-one-savorone': {
    title: 'Reseña de la Capital One SavorOne — 3% en Comidas Sin Cuota Anual | CreditStud.io',
    desc: '3% de cash back en comidas, entretenimiento y supermercados sin cuota anual. Reseña honesta de la Capital One SavorOne.',
    ogTitle: 'Reseña de la Capital One SavorOne | CreditStud.io',
    ogDesc: '3% en comidas y entretenimiento sin cuota anual.',
  },
  'capital-one-savor': {
    title: 'Reseña de la Capital One Savor — 4% en Comidas y Entretenimiento | CreditStud.io',
    desc: '4% de cash back en comidas y entretenimiento. Reseña honesta de la Capital One Savor Cash Rewards.',
    ogTitle: 'Reseña de la Capital One Savor | CreditStud.io',
    ogDesc: '4% en comidas y entretenimiento, 2% en supermercados.',
  },
  'citi-custom-cash': {
    title: 'Reseña de la Citi Custom Cash® Card — 5% en tu Categoría Principal | CreditStud.io',
    desc: '5% de cash back en tu categoría de mayor gasto mensual. Reseña honesta de la Citi Custom Cash Card.',
    ogTitle: 'Reseña de la Citi Custom Cash® Card | CreditStud.io',
    ogDesc: '5% en tu categoría principal de gasto cada mes, sin cuota anual.',
  },
  'citi-double-cash': {
    title: 'Reseña de la Citi® Double Cash Card — 2% en Todo | CreditStud.io',
    desc: '2% de cash back en todas las compras (1% al comprar + 1% al pagar). Reseña honesta de la Citi Double Cash.',
    ogTitle: 'Reseña de la Citi® Double Cash Card | CreditStud.io',
    ogDesc: '2% de cash back en todo: 1% al comprar + 1% al pagar. Sin cuota anual.',
  },
  'citi-premier': {
    title: 'Reseña de la Citi Premier® Card — 3x en 4 Categorías | CreditStud.io',
    desc: '3x puntos en comidas, supermercados, gasolina, viajes aéreos y hoteles. Reseña honesta de la Citi Premier.',
    ogTitle: 'Reseña de la Citi Premier® Card | CreditStud.io',
    ogDesc: '3x puntos en cuatro categorías cotidianas por solo $95/año.',
  },
  'citi-strata-premier': {
    title: 'Reseña de la Citi Strata Premier℠ Card — Viajes y Más | CreditStud.io',
    desc: '3x puntos en viajes, restaurantes y supermercados. Reseña honesta de la Citi Strata Premier.',
    ogTitle: 'Reseña de la Citi Strata Premier℠ Card | CreditStud.io',
    ogDesc: '3x puntos en viajes, restaurantes y supermercados con socios de transferencia.',
  },
  'chase-freedom-flex': {
    title: 'Reseña de la Chase Freedom Flex℠ — 5% en Categorías Rotativas | CreditStud.io',
    desc: '5% de cash back en categorías rotativas (hasta $1,500/trimestre), 3% en comidas y farmacias, sin cuota anual.',
    ogTitle: 'Reseña de la Chase Freedom Flex℠ | CreditStud.io',
    ogDesc: '5% en categorías rotativas, 3% en comidas. Sin cuota anual.',
  },
  'discover-it-cash-back': {
    title: 'Reseña de la Discover it® Cash Back — Cashback Match el Primer Año | CreditStud.io',
    desc: '5% en categorías rotativas, Cashback Match el primer año. Reseña honesta de la Discover it Cash Back.',
    ogTitle: 'Reseña de la Discover it® Cash Back | CreditStud.io',
    ogDesc: '5% en categorías rotativas + Cashback Match el primer año = hasta 10%.',
  },
  'bilt-mastercard': {
    title: 'Reseña de la Bilt Mastercard® — Gana Puntos con el Alquiler | CreditStud.io',
    desc: 'Gana puntos por pagar el alquiler sin comisiones. Reseña honesta de la Bilt Mastercard con socios de transferencia premium.',
    ogTitle: 'Reseña de la Bilt Mastercard® | CreditStud.io',
    ogDesc: 'Gana puntos pagando el alquiler. Socios de transferencia de alto valor.',
  },
  'wells-fargo-active-cash': {
    title: 'Reseña de la Wells Fargo Active Cash® Card — 2% en Todo | CreditStud.io',
    desc: '2% de cash back ilimitado en todas las compras. Reseña honesta de la Wells Fargo Active Cash.',
    ogTitle: 'Reseña de la Wells Fargo Active Cash® Card | CreditStud.io',
    ogDesc: '2% de cash back ilimitado en todas las compras sin cuota anual.',
  },
  'wells-fargo-autograph': {
    title: 'Reseña de la Wells Fargo Autograph℠ Card — 3x en 5 Categorías | CreditStud.io',
    desc: '3x puntos en comidas, viajes, gasolina, transporte y streaming. Sin cuota anual. Reseña honesta de la Wells Fargo Autograph.',
    ogTitle: 'Reseña de la Wells Fargo Autograph℠ Card | CreditStud.io',
    ogDesc: '3x en 5 categorías, sin cuota anual.',
  },
  'us-bank-altitude-go': {
    title: 'Reseña de la US Bank Altitude® Go Visa Signature — 4x en Comidas | CreditStud.io',
    desc: '4x puntos en comidas, sin cuota anual. Reseña honesta de la US Bank Altitude Go.',
    ogTitle: 'Reseña de la US Bank Altitude® Go | CreditStud.io',
    ogDesc: '4x en comidas, 2x en supermercados y gasolina, sin cuota anual.',
  },
  'us-bank-cash-plus': {
    title: 'Reseña de la US Bank Cash+® Visa Signature — 5% en 2 Categorías | CreditStud.io',
    desc: '5% en tus 2 categorías elegidas, 2% en tu categoría cotidiana. Reseña honesta de la US Bank Cash Plus.',
    ogTitle: 'Reseña de la US Bank Cash+® Visa Signature | CreditStud.io',
    ogDesc: '5% en dos categorías a elegir, 2% en otra categoría cotidiana.',
  },
  'amazon-prime-visa-signature': {
    title: 'Reseña de la Amazon Prime Visa Signature — 5% en Amazon | CreditStud.io',
    desc: '5% de cash back en Amazon y Whole Foods con Prime. Reseña honesta de la Amazon Prime Visa Signature.',
    ogTitle: 'Reseña de la Amazon Prime Visa Signature | CreditStud.io',
    ogDesc: '5% en Amazon y Whole Foods, 2% en restaurantes y farmacias con Amazon Prime.',
  },
  'apple-card': {
    title: 'Reseña de la Apple Card — ¿Vale la Pena para Usuarios de iPhone? | CreditStud.io',
    desc: '3% en Apple, 2% con Apple Pay. Reseña honesta del Apple Card para usuarios de iPhone.',
    ogTitle: 'Reseña del Apple Card | CreditStud.io',
    ogDesc: '3% en Apple, 2% con Apple Pay, 1% en todo lo demás. Cash back diario.',
  },
  'barclays-uber-pro': {
    title: 'Reseña de la Barclays Uber Pro Credit Card — Recompensas en Uber | CreditStud.io',
    desc: 'Reseña honesta de la Barclays Uber Pro. Recompensas en Uber y Uber Eats sin cuota anual.',
    ogTitle: 'Reseña de la Barclays Uber Pro Credit Card | CreditStud.io',
    ogDesc: 'Recompensas en Uber, Uber Eats y comidas. Sin cuota anual.',
  },
  'ihg-one-rewards-premier': {
    title: 'Reseña de la IHG One Rewards® Premier Credit Card — Para Viajeros IHG | CreditStud.io',
    desc: 'Reseña honesta de la IHG One Rewards Premier. Noche gratis anual, Platinum Elite status, 26x en hoteles IHG.',
    ogTitle: 'Reseña de la IHG One Rewards® Premier | CreditStud.io',
    ogDesc: 'Noche gratis anual, 26x en hoteles IHG, estatus Platinum Elite.',
  },
  'southwest-priority-card': {
    title: 'Reseña de la Southwest Rapid Rewards® Priority Credit Card | CreditStud.io',
    desc: 'Reseña honesta de la Southwest Priority Card. $75 crédito anual, embarques mejorados, Companion Pass.',
    ogTitle: 'Reseña de la Southwest Priority Card | CreditStud.io',
    ogDesc: '$75 crédito anual de viajes, 4 embarques mejorados, Companion Pass.',
  },
  'bofa-customized-cash-rewards': {
    title: 'Reseña de la Bank of America® Customized Cash Rewards | CreditStud.io',
    desc: 'Reseña honesta de la BofA Customized Cash Rewards. 3% en tu categoría elegida con potencial de bono Preferred Rewards.',
    ogTitle: 'Reseña de la BofA Customized Cash Rewards | CreditStud.io',
    ogDesc: '3% en tu categoría elegida, beneficios mejorados para clientes Preferred Rewards.',
  },
  'chase-ink-business-preferred': {
    title: 'Reseña de la Chase Ink Business Preferred® — La Mejor para Pequeñas Empresas | CreditStud.io',
    desc: 'Reseña honesta de la Chase Ink Business Preferred. 3x en publicidad y envíos. Bono de 100K puntos.',
    ogTitle: 'Reseña de la Chase Ink Business Preferred® | CreditStud.io',
    ogDesc: 'Bono de 100K puntos, 3x en publicidad digital, envíos y viajes.',
  },
};

// Apply meta translations to card pages
const cardsDir = path.join(BASE_DIR, 'cards');
const cardDirs = fs.readdirSync(cardsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const cardDir of cardDirs) {
  const indexPath = path.join(cardsDir, cardDir, 'index.html');
  if (!fs.existsSync(indexPath)) continue;
  
  let content = fs.readFileSync(indexPath, 'utf8');
  const meta = cardMetaTranslations[cardDir];
  
  if (meta) {
    if (meta.title) {
      content = content.replace(/<title>[^<]+<\/title>/, `<title>${meta.title}</title>`);
    }
    if (meta.desc) {
      content = content.replace(/<meta name="description" content="[^"]*">/, 
        `<meta name="description" content="${meta.desc}">`);
    }
    if (meta.ogTitle) {
      content = content.replace(/<meta property="og:title" content="[^"]*">/, 
        `<meta property="og:title" content="${meta.ogTitle}">`);
      content = content.replace(/<meta name="twitter:title" content="[^"]*">/, 
        `<meta name="twitter:title" content="${meta.ogTitle}">`);
    }
    if (meta.ogDesc) {
      content = content.replace(/<meta property="og:description" content="[^"]*">/, 
        `<meta property="og:description" content="${meta.ogDesc}">`);
      content = content.replace(/<meta name="twitter:description" content="[^"]*">/, 
        `<meta name="twitter:description" content="${meta.ogDesc}">`);
    }
  }
  
  fs.writeFileSync(indexPath, content, 'utf8');
}

// Now do the cards/index.html page
const cardsIndexPath = path.join(cardsDir, 'index.html');
if (fs.existsSync(cardsIndexPath)) {
  let content = fs.readFileSync(cardsIndexPath, 'utf8');
  
  // Translate meta tags
  content = content.replace(/<title>[^<]+<\/title>/,
    '<title>Reseñas de Tarjetas de Crédito — Veredictos Honestos | CreditStud.io</title>');
  content = content.replace(/<meta name="description" content="[^"]*">/,
    '<meta name="description" content="Reseñas honestas de tarjetas de crédito con matemáticas reales, desglose de beneficios y veredictos editoriales. Sin relleno, sin SEO vacío — solo los números.">');
  content = content.replace(/<meta property="og:title" content="[^"]*">/,
    '<meta property="og:title" content="Las Mejores Reseñas y Comparaciones de Tarjetas de Crédito — CreditStud.io">');
  content = content.replace(/<meta property="og:description" content="[^"]*">/,
    '<meta property="og:description" content="Compara tarjetas de crédito con matemáticas reales. Reseñas de 28+ tarjetas con bonos de bienvenida, valores de recompensas y veredictos honestos.">');
  content = content.replace(/<meta name="twitter:title" content="[^"]*">/,
    '<meta name="twitter:title" content="Las Mejores Reseñas y Comparaciones de Tarjetas de Crédito — CreditStud.io">');
  content = content.replace(/<meta name="twitter:description" content="[^"]*">/,
    '<meta name="twitter:description" content="Compara tarjetas de crédito con matemáticas reales. Reseñas de 28+ tarjetas con veredictos honestos.">');
  
  // Translate body content in cards index
  content = content.replace(/(<h1[^>]*>)[^<]*(Credit Card Reviews)[^<]*(<\/h1>)/g,
    '$1Reseñas de Tarjetas de Crédito — Veredictos Honestos$3');
  content = content.replace(/Honest credit card reviews with real math, perks breakdowns, and editorial verdicts\. No fluff, no SEO filler — just the numbers\./g,
    'Reseñas honestas de tarjetas de crédito con matemáticas reales, desglose de beneficios y veredictos editoriales. Sin relleno — solo los números.');
  
  // Translate card listing descriptions
  content = content.replace(/>Dining and grocery heavy spenders who want simple cash back</g, '>Grandes gastadores en comidas y supermercados que quieren cash back sencillo<');
  content = content.replace(/>People who want a simple set-it-and-forget-it card</g, '>Personas que quieren una tarjeta sencilla que no requiera atención<');
  content = content.replace(/>Families spending \$400\+\/month at U\.S\. supermarkets</g, '>Familias que gastan $400+/mes en supermercados de EE.UU.<');
  content = content.replace(/>People who will activate quarterly 5% categories and maximize \$1,500\/quarter</g, '>Personas que activarán categorías trimestrales al 5% y maximizarán $1,500/trimestre<');
  content = content.replace(/>Grocery shoppers spending \$200–\$500\/month at U\.S\. supermarkets</g, '>Compradores que gastan $200–$500/mes en supermercados de EE.UU.<');
  content = content.replace(/>Mid-tier travelers who want 3x on travel and dining for \$95\/year</g, '>Viajeros de nivel medio que quieren 3x en viajes y comidas por $95/año<');
  content = content.replace(/>People who want 2% cash back everywhere with zero effort</g, '>Personas que quieren 2% de cash back en todas partes sin esfuerzo<');
  content = content.replace(/>People who want 3x on 5 categories with no annual fee</g, '>Personas que quieren 3x en 5 categorías sin cuota anual<');
  content = content.replace(/>Heavy diners who want the best no-AF dining rate</g, '>Grandes gastadores en restaurantes que quieren la mejor tasa sin cuota<');
  content = content.replace(/>People with one dominant spending category that changes month to month</g, '>Personas con una categoría de gasto dominante que cambia mes a mes<');
  content = content.replace(/>People who want zero-hassle cash back with no annual fee</g, '>Personas que quieren cash back sin complicaciones y sin cuota anual<');
  content = content.replace(/>First-year cardholders who max out the Cashback Match \(effectively 10% in rotating categories year one\)</g, '>Titulares del primer año que maximizan el Cashback Match (efectivamente 10% en categorías rotativas el año uno)<');
  content = content.replace(/>BofA checking\/savings customers who qualify for Preferred Rewards boosts</g, '>Clientes de cuenta corriente/ahorros de BofA que califican para bonificaciones Preferred Rewards<');
  content = content.replace(/>People who want maximum control over their bonus categories</g, '>Personas que quieren máximo control sobre sus categorías de bonificación<');
  content = content.replace(/>Heavy diners who eat out 4\+ times per month</g, '>Grandes comensales que salen a comer 4+ veces al mes<');
  content = content.replace(/>Frequent Southwest flyers with 4\+ flights per year</g, '>Viajeros frecuentes de Southwest con 4+ vuelos al año<');
  content = content.replace(/>People who stay at IHG hotels 5\+ nights per year \(Holiday Inn, Crowne Plaza, InterContinental, Kimpton\)</g, '>Personas que se hospedan en hoteles IHG 5+ noches al año (Holiday Inn, Crowne Plaza, InterContinental, Kimpton)<');
  content = content.replace(/>Frequent Uber and Uber Eats users</g, '>Usuarios frecuentes de Uber y Uber Eats<');
  content = content.replace(/>Amazon Prime members who shop Amazon regularly</g, '>Miembros de Amazon Prime que compran en Amazon regularmente<');
  content = content.replace(/>iPhone users who pay with Apple Pay everywhere</g, '>Usuarios de iPhone que pagan con Apple Pay en todas partes<');
  content = content.replace(/>People who want 3x on four everyday categories without paying \$300\+</g, '>Personas que quieren 3x en cuatro categorías cotidianas sin pagar $300+<');
  content = content.replace(/>Small business owners with shipping or advertising expenses</g, '>Propietarios de pequeñas empresas con gastos de envío o publicidad<');
  
  // Translate Read review links
  content = content.replace(/>Read review →</g, '>Leer reseña →<');
  
  // Translate "Not sure which card is right?" section
  content = content.replace(/Not sure which card is right\?/g, '¿No sabes cuál tarjeta es la correcta?');
  content = content.replace(/Our <a href="\/es\/rewards\/">Rewards Calculator<\/a> picks the best card for your spending in seconds\./g,
    'Nuestra <a href="/es/rewards/">Calculadora de Recompensas</a> elige la mejor tarjeta para tus gastos en segundos.');
  
  fs.writeFileSync(cardsIndexPath, content, 'utf8');
  console.log('Fixed cards/index.html');
}

console.log('Card translations done!');
