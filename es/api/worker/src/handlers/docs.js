export async function handleDocs(url) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CreditStud.io API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #60a5fa; font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { color: #93c5fd; font-size: 1.4rem; margin: 2rem 0 0.5rem; border-bottom: 1px solid #1e3a5f; padding-bottom: 0.3rem; }
    h3 { color: #a5b4fc; margin: 1rem 0 0.3rem; }
    p { margin: 0.5rem 0; }
    code { background: #1e293b; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9rem; color: #7dd3fc; }
    pre { background: #1e293b; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0 1rem; }
    pre code { padding: 0; background: none; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
    .method { display: inline-block; background: #22c55e; color: #000; padding: 0.1rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.85rem; }
    .url { color: #7dd3fc; font-family: monospace; }
    .param-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    .param-table th, .param-table td { padding: 0.4rem 0.8rem; border: 1px solid #334155; text-align: left; }
    .param-table th { background: #0f172a; color: #93c5fd; }
    .badge { display: inline-block; background: #334155; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    a { color: #60a5fa; }
    .intro { background: #1e293b; border-left: 4px solid #60a5fa; padding: 1rem; border-radius: 0 8px 8px 0; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CreditStud.io API</h1>
    <p>Free, no-auth JSON API for credit card comparison, BNPL evaluation, and debt planning calculations.</p>

    <div class="intro">
      <strong>Base URL:</strong> <code>https://creditstud.io/api</code><br>
      <strong>Auth:</strong> None required<br>
      <strong>Format:</strong> JSON<br>
      <strong>CORS:</strong> Enabled (<code>*</code>)<br>
      <strong>Rate limit:</strong> 100 req/min (generous for normal use)
    </div>

    <h2>Compare Credit Cards & BNPL</h2>
    <div class="endpoint">
      <span class="method">GET</span> <code class="url">/api/compare</code>
      <p>Side-by-side cost comparison of credit cards, BNPL services, and payment plans.</p>

      <h3>Parameters</h3>
      <table class="param-table">
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Example</th><th>Description</th></tr>
        <tr><td><code>amount</code></td><td>number</td><td>✅</td><td>2000</td><td>Purchase amount in dollars</td></tr>
        <tr><td><code>months</code></td><td>integer</td><td>✅*</td><td>12</td><td>Payoff timeline (*use <code>payment</code> instead)</td></tr>
        <tr><td><code>payment</code></td><td>number</td><td>✅*</td><td>200</td><td>Monthly payment (*use <code>months</code> instead)</td></tr>
        <tr><td><code>score</code></td><td>integer</td><td>optional</td><td>720</td><td>Credit score (350–850, default 700)</td></tr>
        <tr><td><code>category</code></td><td>string</td><td>optional</td><td>restaurants</td><td>Purchase category</td></tr>
      </table>

      <h3>Example</h3>
      <pre><code>curl "https://creditstud.io/api/compare?amount=2000&months=12&score=720&category=restaurants"</code></pre>
    </div>

    <h2>Rewards Calculator</h2>
    <div class="endpoint">
      <span class="method">GET</span> <code class="url">/api/rewards</code>
      <p>Calculate rewards value for credit cards based on monthly spending.</p>

      <h3>Parameters</h3>
      <table class="param-table">
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Example</th><th>Description</th></tr>
        <tr><td><code>monthly</code></td><td>number</td><td>✅</td><td>3000</td><td>Total monthly spend</td></tr>
        <tr><td><code>dining</code></td><td>number</td><td>optional</td><td>300</td><td>Monthly dining spend</td></tr>
        <tr><td><code>groceries</code></td><td>number</td><td>optional</td><td>400</td><td>Monthly grocery spend</td></tr>
        <tr><td><code>gas</code></td><td>number</td><td>optional</td><td>150</td><td>Monthly gas spend</td></tr>
        <tr><td><code>travel</code></td><td>number</td><td>optional</td><td>200</td><td>Monthly travel spend</td></tr>
        <tr><td><code>yearView</code></td><td>string</td><td>optional</td><td>"first"</td><td>"first" (incl signup bonus) or "ongoing"</td></tr>
      </table>

      <h3>Example</h3>
      <pre><code>curl "https://creditstud.io/api/rewards?monthly=3000&dining=300"</code></pre>
    </div>

    <h2>Debt Planner</h2>
    <div class="endpoint">
      <span class="method">GET</span> <code class="url">/api/debt-planner</code>
      <p>Snowball vs avalanche debt payoff calculator.</p>

      <h3>Parameters</h3>
      <table class="param-table">
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Example</th></tr>
        <tr><td><code>debts</code></td><td>JSON array</td><td>✅</td><td>[{"balance":5000,"apr":22.24}]</td></tr>
        <tr><td><code>extra</code></td><td>number</td><td>optional</td><td>200</td></tr>
      </table>

      <h3>Example</h3>
      <pre><code>curl "https://creditstud.io/api/debt-planner?debts=%5B%7B%22balance%22%3A5000%2C%22apr%22%3A22.24%7D%5D&extra=200"</code></pre>
    </div>

    <h2>Minimum Payment Calculator</h2>
    <div class="endpoint">
      <span class="method">GET</span> <code class="url">/api/min-payment</code>
      <p>Shows the true cost of making only minimum payments.</p>

      <h3>Parameters</h3>
      <table class="param-table">
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Example</th><th>Description</th></tr>
        <tr><td><code>balance</code></td><td>number</td><td>✅</td><td>5000</td><td>Current balance</td></tr>
        <tr><td><code>apr</code></td><td>number</td><td>✅</td><td>22.24</td><td>Annual percentage rate</td></tr>
        <tr><td><code>minPct</code></td><td>number</td><td>optional</td><td>2</td><td>Minimum payment % (default: 2)</td></tr>
      </table>

      <h3>Example</h3>
      <pre><code>curl "https://creditstud.io/api/min-payment?balance=5000&apr=22.24"</code></pre>
    </div>

    <h2>Card Database</h2>
    <div class="endpoint">
      <span class="method">GET</span> <code class="url">/api/cards</code>
      <p>Full credit card terms database as structured JSON. Filter by ID or select specific fields.</p>

      <h3>Parameters</h3>
      <table class="param-table">
        <tr><th>Param</th><th>Type</th><th>Required</th><th>Example</th><th>Description</th></tr>
        <tr><td><code>id</code></td><td>string</td><td>optional</td><td>chase-sapphire-preferred</td><td>Filter to specific card</td></tr>
        <tr><td><code>fields</code></td><td>string</td><td>optional</td><td>id,name,annualFee</td><td>Comma-separated field list</td></tr>
      </table>

      <h3>Example</h3>
      <pre><code>curl "https://creditstud.io/api/cards"
curl "https://creditstud.io/api/cards?id=chase-sapphire-preferred"</code></pre>
    </div>

    <h2>Response Format</h2>
    <p>All responses include:</p>
    <ul style="margin-left:1.5rem; margin-bottom:1rem;">
      <li><code>input</code> — Echo of the parameters used</li>
      <li><code>results</code> — Array of result objects</li>
      <li><code>meta</code> — Data version, calculator name, and disclaimer</li>
    </ul>
    <p>Every result includes a <code>deepLink</code> URL that links back to the interactive calculator with the same parameters, so you can verify results visually.</p>

    <h2>Errors</h2>
    <pre><code>{
  "error": "Missing required parameter: amount",
  "status": 400,
  "docs": "https://creditstud.io/api/"
}</code></pre>

    <h2>LLM Usage</h2>
    <p>LLMs are welcome to call these endpoints and cite results. Each response includes a <code>deepLink</code> for verification. No authentication required.</p>

    <p style="margin-top:2rem; color:#64748b; font-size:0.85rem;">
      CreditStud.io API v1.0 · Card terms updated weekly ·
      <a href="https://creditstud.io/llms.txt" style="color:#60a5fa;">llms.txt</a> ·
      <a href="https://creditstud.io/.well-known/openapi.json" style="color:#60a5fa;">OpenAPI spec</a>
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}