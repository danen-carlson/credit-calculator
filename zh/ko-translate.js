const fs = require('fs');

async function translate() {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    console.error("No API key found in env, checking .env file directly...");
    const envFile = fs.readFileSync('/Users/system/.openclaw/.env', 'utf8');
    const match = envFile.match(/VENICE_API_KEY=(.+)/);
    if (match) {
        process.env.VENICE_API_KEY = match[1].trim();
    } else {
        console.error("Still no Venice API key.");
        process.exit(1);
    }
  }

  const koFile = '/Users/system/.openclaw/workspace/credit-calculator/locales/ko-seo.json';
  const enSourceFile = '/Users/system/.openclaw/workspace/credit-calculator/.states/en-faq-source.json';
  
  // Read ko-seo.json as our target structure
  const koSeo = JSON.parse(fs.readFileSync(koFile, 'utf8'));
  
  // Try to find the English source content to base the translation on
  // Since zh-seo.json has content, read that as well for context on lengths/intent
  const zhFile = '/Users/system/.openclaw/workspace/credit-calculator/locales/zh-seo.json';
  const zhSeo = JSON.parse(fs.readFileSync(zhFile, 'utf8'));

  const systemPrompt = `You are an expert translator translating SEO metadata for CreditStud.io from English/Chinese to Korean.

Translation rules:
- NEVER translate: card names (Chase Sapphire Preferred, Amex Gold, Capital One Quicksilver, etc.), bank names (Chase, Citi, Capital One, Wells Fargo, Discover, Amex), BNPL names (Klarna, Afterpay, Affirm, Sezzle, Zip), FICO, VantageScore, APR, BNPL
- Keep dollar amounts ($XX), percentages (XX%), and numbers exactly as written
- Korean terminology: 신용점수 (credit score), 잔액이체 (balance transfer), 연회비 (annual fee), 최소결제 (minimum payment), 가입 보너스 (signup bonus), 캐시백 (cash back), 이자율 (interest rate), 신용한도 (credit limit), 해외거래수수료 (foreign transaction fee), 스테이트먼트 크레딧 (statement credit)
- Use natural Korean for US Korean-speaking audience
- Keep titles under 60 characters, descriptions under 160 characters
- Use polite/formal register (합쇼체/해요체)

Reply ONLY with the translated JSON string. Do not use markdown blocks. Do not add any extra text before or after the JSON. The JSON must exactly match the keys of the provided object (excluding FAQs).`;

  let keys = Object.keys(koSeo);
  console.log(`Found ${keys.length} pages to translate.`);
  
  let translatedCount = 0;

  for (let i = 0; i < keys.length; i++) {
    const pageKey = keys[i];
    const sourceObj = zhSeo[pageKey];
    if (!sourceObj) {
      console.log(`Skipping ${pageKey} - not found in source`);
      continue;
    }

    const targetObj = { ...koSeo[pageKey] };
    
    // Create an object with just the SEO fields we want to translate (no FAQ yet)
    let seoToTranslate = {};
    const seoFields = ['title', 'description', 'og_title', 'og_description', 'twitter_title', 'twitter_description', 'ld_headline', 'ld_description', 'ld_breadcrumb_last'];
    
    let hasContent = false;
    for (const field of seoFields) {
      // Pass the zh version to the LLM to understand intent
      if (sourceObj[field]) {
          seoToTranslate[field] = sourceObj[field];
          hasContent = true;
      }
    }
    
    if (!hasContent) continue;

    console.log(`Translating ${pageKey} (${i + 1}/${keys.length})...`);
    
    const body = {
      model: "qwen3-coder-480b-a35b-instruct", // Use coding model for better JSON adherence, or switch to prompt if needed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Translate the values of this JSON object to Korean following the rules. Reply ONLY with valid JSON:\n\n${JSON.stringify(seoToTranslate, null, 2)}` }
      ]
    };

    try {
      const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.VENICE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        let text = data.choices[0].message.content.trim();
      if (text.startsWith("```json")) {
        text = text.substring(7);
        if (text.endsWith("```")) {
            text = text.substring(0, text.length - 3);
        }
      }
      
      const translatedJson = JSON.parse(text);
      
      for (const field of seoFields) {
        if (translatedJson[field]) {
            targetObj[field] = translatedJson[field];
        }
      }
      
      } else {
        console.error(`Error on ${pageKey}: Venice API text generation failed - ${JSON.stringify(data)}`);
      }
      
    } catch (err) {
      console.error(`Error on ${pageKey}: ${err.message}`);
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`Done translating ${translatedCount} pages.`);
}

translate();