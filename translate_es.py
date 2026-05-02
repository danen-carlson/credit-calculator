#!/usr/bin/env python3
"""
Translate English content in ES HTML files to Spanish.
Preserves all HTML structure, class names, IDs, hrefs, JS, CSS.
Does NOT translate card names, APR, BNPL, cash back (keeps as-is).
"""

import re
import os

BASE = '/Users/system/.openclaw/workspace/credit-calculator'

# Common UI label translations used across merchant pages
COMMON_LABELS = [
    ('Annual Fee', 'Cuota Anual'),
    ('Signup Bonus', 'Bono de Bienvenida'),
    ('Reward Rate', 'Tasa de Recompensa'),
    ('Calculate Rewards', 'Calcular Recompensas'),
    ('Calculate', 'Calcular'),
    ('Full Rewards Calculator', 'Calculadora Completa de Recompensas'),
    ('Full calculator: <a href="../rewards/">Rewards Tool</a>', 'Calculadora completa: <a href="../rewards/">Herramienta de Recompensas</a>'),
    ('Want to compare all categories? Try our <a href="../rewards/">full rewards calculator</a>.', '¿Quieres comparar todas las categorías? Prueba nuestra <a href="../rewards/">calculadora completa de recompensas</a>.'),
    ('Compare Other Categories', 'Comparar Otras Categorías'),
    ('Compare Other Retailers', 'Comparar Otros Comercios'),
    ('Compare Other Categories</h2>', 'Comparar Otras Categorías</h2>'),
    ('Compare Other Retailers</h2>', 'Comparar Otros Comercios</h2>'),
    ('Other Retail Guides', 'Otras Guías de Comercios'),
    ('Best for Amazon', 'Mejor para Amazon'),
    ('Best for Walmart', 'Mejor para Walmart'),
    ('Best for Groceries', 'Mejor para Supermercados'),
    ('Best Credit Card for Walmart', 'Mejor Tarjeta de Crédito para Walmart'),
    ('Best Credit Card for Target', 'Mejor Tarjeta de Crédito para Target'),
    ('Best Credit Card for Groceries', 'Mejor Tarjeta de Crédito para Supermercados'),
    ('Best Credit Card for Amazon', 'Mejor Tarjeta de Crédito para Amazon'),
    ('Best Credit Card for Gas Stations', 'Mejor Tarjeta de Crédito para Gasolineras'),
    ('Best Credit Card for Dining', 'Mejor Tarjeta de Crédito para Restaurantes'),
    ('Best Credit Card for Travel', 'Mejor Tarjeta de Crédito para Viajes'),
    ('Best Credit Card for Streaming', 'Mejor Tarjeta de Crédito para Streaming'),
    ('Best Credit Cards for Streaming Services', 'Mejores Tarjetas para Servicios de Streaming'),
    ('Best Credit Cards for Online Shopping', 'Mejores Tarjetas para Compras en Línea'),
    ('Best Credit Cards for Costco &amp; Sam\'s Club', 'Mejores Tarjetas para Costco y Sam\'s Club'),
    ('Best Credit Cards for Pharmacy &amp; Drugstores', 'Mejores Tarjetas para Farmacias y Droguerías'),
    ('Best Credit Card for Dining &amp; Restaurants', 'Mejor Tarjeta de Crédito para Restaurantes'),
    ('Affiliate Disclosure', 'Divulgación de Afiliados'),
    ('CreditStud.io is for informational purposes only. Actual rates, terms, and eligibility may vary.', 'CreditStud.io es solo para fines informativos. Las tasas, términos y elegibilidad reales pueden variar.'),
    ('CreditStud.io informational only.', 'CreditStud.io solo para fines informativos.'),
    ('<a href="/disclosure.html">Disclosure</a>', '<a href="/es/disclosure.html">Divulgación</a>'),
    ('Skip to main content', 'Saltar al contenido principal'),
    ('No credit history', 'Sin historial crediticio'),
    ('Good (670+)', 'Bueno (670+)'),
    ('Fair (580+)', 'Regular (580+)'),
    ('Good', 'Bueno'),
    ('Bad for ongoing rent', 'Malo para alquiler continuo'),
    ('LOSES money at 2.5% fee', 'PIERDE dinero con comisión del 2.5%'),
    ('guaranteed 2%', '2% garantizado'),
    ('deposits to brokerage', 'depósitos a corretaje'),
    ('2x everything', '2% en todo'),
    ('2% everywhere</div>', '2% en todas partes</div>'),
    ('2% everywhere (1% buy + 1% pay)', '2% en todas partes (1% al comprar + 1% al pagar)'),
]


def apply_common(content):
    for en, es in COMMON_LABELS:
        content = content.replace(en, es)
    return content


def translate_costco(content):
    content = content.replace(
        '<title>Best Credit Card for Costco | CreditStud.io</title>',
        '<title>Mejor Tarjeta de Crédito para Costco | CreditStud.io</title>'
    )
    content = content.replace(
        '<meta name="description" content="Best credit cards for Costco shopping, gas, and bulk buys. Maximize rewards at warehouse clubs with flat-rate cash back cards.">',
        '<meta name="description" content="Mejores tarjetas de crédito para compras en Costco, gasolina y compras al por mayor. Maximiza las recompensas en los clubes de almacén con tarjetas de cash back de tasa plana.">'
    )
    content = content.replace(
        '<meta property="og:title" content="Best Credit Card for Costco | CreditStud.io">',
        '<meta property="og:title" content="Mejor Tarjeta de Crédito para Costco | CreditStud.io">'
    )
    content = content.replace(
        '<meta property="og:description" content="Top cards for Costco purchases including gas stations and groceries.">',
        '<meta property="og:description" content="Las mejores tarjetas para compras en Costco, incluyendo gasolineras y supermercados.">'
    )
    content = content.replace(
        '<meta name="twitter:title" content="Best Credit Card for Costco | CreditStud.io">',
        '<meta name="twitter:title" content="Mejor Tarjeta de Crédito para Costco | CreditStud.io">'
    )
    content = content.replace(
        '<meta name="twitter:description" content="Top cards for Costco purchases including gas stations and groceries.">',
        '<meta name="twitter:description" content="Las mejores tarjetas para compras en Costco, incluyendo gasolineras y supermercados.">'
    )
    # JSON-LD FAQ
    content = content.replace(
        '"name": "What is the best credit card for Costco purchases?"',
        '"name": "¿Cuál es la mejor tarjeta de crédito para compras en Costco?"'
    )
    content = content.replace(
        '"text": "Flat-rate 2% cash back cards like Wells Fargo Active Cash or Citi Double Cash excel at Costco since there\'s no specific category bonus. The Costco Anywhere Visa (4% at Costco) requires membership but offers superior rates."',
        '"text": "Las tarjetas de cash back de tasa plana del 2%, como Wells Fargo Active Cash o Citi Double Cash, destacan en Costco ya que no hay bono de categoría específico. La Costco Anywhere Visa (4% en Costco) requiere membresía pero ofrece tasas superiores."'
    )
    content = content.replace(
        '"name": "Does Costco accept all credit cards?"',
        '"name": "¿Costco acepta todas las tarjetas de crédito?"'
    )
    content = content.replace(
        '"text": "Costco accepts Visa only in warehouses. No Mastercard, Amex, or Discover. Use 2% Visa cards like Wells Fargo Active Cash for maximum rewards."',
        '"text": "Costco solo acepta Visa en sus almacenes. No acepta Mastercard, Amex ni Discover. Usa tarjetas Visa del 2% como Wells Fargo Active Cash para máximas recompensas."'
    )
    content = content.replace(
        '"name": "Is the Costco Anywhere Visa the best option?"',
        '"name": "¿La Costco Anywhere Visa es la mejor opción?"'
    )
    content = content.replace(
        '"text": "Yes for heavy Costco shoppers (4% cash back), but requires Costco membership ($60+/yr). General 2% cards work without membership and everywhere else."',
        '"text": "Sí para quienes compran mucho en Costco (4% de cash back), pero requiere membresía de Costco ($60+/año). Las tarjetas generales del 2% funcionan sin membresía y en cualquier lugar."'
    )
    content = content.replace(
        '"name": "Which card is best for Costco gas?"',
        '"name": "¿Qué tarjeta es mejor para gasolina en Costco?"'
    )
    content = content.replace(
        '"text": "US Bank Cash+ (5% gas up to $3k/quarter combined categories) or Costco Anywhere Visa (4% gas). Pair with Costco membership for lowest prices."',
        '"text": "US Bank Cash+ (5% en gasolina hasta $3k/trimestre en categorías combinadas) o Costco Anywhere Visa (4% en gasolina). Combínala con la membresía de Costco para los precios más bajos."'
    )
    # Breadcrumb
    content = content.replace(
        '{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://creditstud.io/"},\n      {"@type": "ListItem", "position": 2, "name": "Best Credit Cards for Merchants", "item": "https://creditstud.io/merchant/"},\n      {"@type": "ListItem", "position": 3, "name": "Costco", "item": "https://creditstud.io/merchant/costco.html"}',
        '{"@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://creditstud.io/"},\n      {"@type": "ListItem", "position": 2, "name": "Mejores Tarjetas por Comercio", "item": "https://creditstud.io/merchant/"},\n      {"@type": "ListItem", "position": 3, "name": "Costco", "item": "https://creditstud.io/merchant/costco.html"}'
    )
    # Main content
    content = content.replace(
        '<h1>Best Credit Card for Costco</h1>',
        '<h1>Mejor Tarjeta de Crédito para Costco</h1>'
    )
    content = content.replace(
        '''      <div class="merchant-intro">
        <p>Costco bulk buys, cheap gas, and Kirkland quality make it a shopping powerhouse. But limited payment options (Visa only) and membership fees mean choosing the right credit card is crucial for maximizing rewards.</p>
        <p>Average Costco trips ($200+) across groceries, gas, and household goods favor <strong>flat-rate 2% cash back Visa cards</strong>. Heavy gas buyers can hit 5% with category pickers. The Costco Anywhere Visa shines for members (4% at Costco), but general cards offer flexibility.</p>
        <p>Remember: Costco charges no credit card surcharge on their Visa, but only Visa works in warehouses. Gas pumps accept Visa too. Rewards add up fast on $5k+ annual spend. Pair with Executive membership (2% Costco rewards) for stacking.</p>
        <p>Our picks based on \'everything\' category rates (Costco coded as general purchase).</p>
      </div>''',
        '''      <div class="merchant-intro">
        <p>Las compras al por mayor, la gasolina barata y la calidad Kirkland hacen de Costco un gigante del comercio. Sin embargo, las opciones de pago limitadas (solo Visa) y las cuotas de membresía hacen que elegir la tarjeta de crédito correcta sea crucial para maximizar las recompensas.</p>
        <p>Los viajes promedio a Costco ($200+) en supermercados, gasolina y artículos del hogar favorecen las <strong>tarjetas Visa de cash back de tasa plana del 2%</strong>. Los grandes compradores de gasolina pueden alcanzar el 5% con tarjetas de selección de categorías. La Costco Anywhere Visa destaca para miembros (4% en Costco), pero las tarjetas generales ofrecen más flexibilidad.</p>
        <p>Recuerda: Costco no cobra recargo por tarjeta de crédito en su Visa, pero solo Visa funciona en los almacenes. Los surtidores de gasolina también aceptan Visa. Las recompensas se acumulan rápido con un gasto anual de $5k+. Combina con la membresía Executive (2% de recompensas Costco) para sumar más.</p>
        <p>Nuestras selecciones basadas en tasas de categoría "general" (Costco codificado como compra general).</p>
      </div>'''
    )
    content = content.replace(
        '<h2>Top 3 Cards for Costco Shopping</h2>',
        '<h2>Las 3 Mejores Tarjetas para Comprar en Costco</h2>'
    )
    content = content.replace(
        '<div class="result-type">Cashback</div>\n            </div>\n            <div class="result-cost">\n              <div class="result-total">$240/yr</div>\n              <div class="result-savings good">on $1,000/mo Costco</div>',
        '<div class="result-type">Cash Back</div>\n            </div>\n            <div class="result-cost">\n              <div class="result-total">$240/yr</div>\n              <div class="result-savings good">en $1,000/mes en Costco</div>'
    )
    content = content.replace(
        '              <div class="detail-label">Costco Rate</div>\n                <div class="detail-value good">2%</div>',
        '              <div class="detail-label">Tasa en Costco</div>\n                <div class="detail-value good">2%</div>'
    )
    content = content.replace(
        '              <div class="detail-label">Costco Rate</div>\n                <div class="detail-value">2%</div>',
        '              <div class="detail-label">Tasa en Costco</div>\n                <div class="detail-value">2%</div>'
    )
    content = content.replace(
        'Annual Fee</div>\n              <div class="detail-value">$0</div>\n              </div>\n              <div class="detail-item">\n                <div class="detail-label">Signup Bonus</div>\n                <div class="detail-value">$200</div>\n              </div>\n            </div>\n            <div class="result-notes good-note">Unlimited 2% Visa - perfect for Costco Visa-only policy.</div>',
        'Cuota Anual</div>\n              <div class="detail-value">$0</div>\n              </div>\n              <div class="detail-item">\n                <div class="detail-label">Bono de Bienvenida</div>\n                <div class="detail-value">$200</div>\n              </div>\n            </div>\n            <div class="result-notes good-note">Visa con 2% ilimitado: perfecta para la política de solo Visa de Costco.</div>'
    )
    content = content.replace(
        '<div class="result-savings">2% everything</div>',
        '<div class="result-savings">2% en todo</div>'
    )
    content = content.replace(
        '"Signup Bonus</div>\n                <div class="detail-value">None</div>',
        '"Bono de Bienvenida</div>\n                <div class="detail-value">Ninguno</div>'
    )
    content = content.replace(
        '<div class="result-notes">Great for investors - auto-deposits rewards.</div>',
        '<div class="result-notes">Ideal para inversores: deposita recompensas automáticamente.</div>'
    )
    content = content.replace(
        '<h2>Test Your Costco Spending</h2>',
        '<h2>Calcula tu Gasto en Costco</h2>'
    )
    content = content.replace(
        '<label for="costco-spend">Monthly Costco Spend</label>',
        '<label for="costco-spend">Gasto Mensual en Costco</label>'
    )
    content = content.replace(
        '<button class="btn-primary" onclick="calculateCostcoRewards()">Calculate</button>',
        '<button class="btn-primary" onclick="calculateCostcoRewards()">Calcular</button>'
    )
    content = content.replace(
        '<p><small><a href="../rewards/">Full Rewards Calculator</a></small></p>',
        '<p><small><a href="../rewards/">Calculadora Completa de Recompensas</a></small></p>'
    )
    content = content.replace(
        '<h2>Other Retail Guides</h2>\n        <ul>\n          <li><a href="amazon.html">Best for Amazon</a></li>\n          <li><a href="walmart.html">Best for Walmart</a></li>\n          <li><a href="groceries.html">Best for Groceries</a></li>\n        </ul>',
        '<h2>Otras Guías de Comercios</h2>\n        <ul>\n          <li><a href="amazon.html">Mejor para Amazon</a></li>\n          <li><a href="walmart.html">Mejor para Walmart</a></li>\n          <li><a href="groceries.html">Mejor para Supermercados</a></li>\n        </ul>'
    )
    content = content.replace(
        '<p>CreditStud.io is for informational purposes only. <a href="/disclosure.html">Affiliate Disclosure</a></p>',
        '<p>CreditStud.io es solo para fines informativos. <a href="/es/disclosure.html">Divulgación de Afiliados</a></p>'
    )
    return content


def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Written: {path}")


# Process costco
costco_path = f'{BASE}/es/merchant/costco.html'
content = read_file(costco_path)
content = translate_costco(content)
content = apply_common(content)
write_file(costco_path, content)

print("Done!")
