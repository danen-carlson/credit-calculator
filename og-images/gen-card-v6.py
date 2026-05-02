import requests, json, base64

API_KEY = "VENICE-ADMIN-KEY-knl-Yo-DtWwYKEvxYerIpjapakObk2NhK2cPHhxyfb"
OUT_DIR = "."

prompts = [
    {
        "model": "gpt-image-1-5",
        "prompt": "A photorealistic premium black credit card, viewed flat from directly above, credit card proportions (wider than tall, approximately 1.6 to 1 aspect ratio). The card features: An ornate decorative silver metallic border with elegant corner flourishes and scrollwork. CREDITSTUD.IO in VERY LARGE bold silver metallic embossed raised lettering across the upper portion, much larger than typical credit card text. In the exact center, an intricate silver metallic embossed circular medallion portrait of a Labrador dog wearing ornate medieval knight armor with a centurion-style plumed helmet, rendered in detailed silver engraving relief style identical to the American Express Centurion portrait. Card number: 3141 5926 5358 9793 in silver metallic embossed text below the medallion. Cardholder name: FINANCIALLY SECURE in silver metallic embossed text lower left. Expiration date: 12/30. The entire card surface is matte black, all design elements are brushed silver metallic raised embossed. No background visible. Ultra realistic luxury product photography.",
        "file": "logo-v6-card-lab-gpt.png",
        "w": 1280,
        "h": 800
    },
    {
        "model": "flux-2-max",
        "prompt": "A single premium black titanium credit card lying flat, top-down product photography, exact credit card proportions wider than tall about 1.6 to 1 ratio. Ornate silver metallic decorative border with elegant scrollwork corner flourishes. CREDITSTUD.IO stamped in VERY LARGE bold silver metallic raised embossed lettering across the upper portion, significantly larger and bolder than typical credit card text. In the center a detailed silver metallic embossed circular medallion portrait of a Labrador wearing medieval knight armor with a plumed centurion helmet, identical in style to the Amex Centurion portrait. Card number reads 3141 5926 5358 9793 in silver metallic embossed digits below the medallion. Cardholder name reads FINANCIALLY SECURE in silver metallic embossed text lower left. Expiration 12/30 lower right. Matte black card surface, brushed silver metallic raised elements. Photorealistic luxury product mockup. No background.",
        "file": "logo-v6-card-lab-flux.png",
        "w": 1280,
        "h": 800
    },
    {
        "model": "gpt-image-1-5",
        "prompt": "A photorealistic matte black credit card design, flat top-down product photography view, proper credit card dimensions wider than tall. Ornate silver Victorian decorative border with corner scrollwork flourishes. CREDITSTUD.IO written in VERY LARGE bold silver metallic raised embossed lettering across the top third of the card. Center medallion: intricate silver metallic embossed portrait of a Labrador wearing plate armor and a centurion plumed helmet, in a circular ornate frame, identical engraving style to American Express Centurion. Card number below medallion: 3141 5926 5358 9793 in silver metallic embossed digits. Cardholder name: FINANCIALLY SECURE in silver metallic embossed text lower left. Expiration: 12/30 lower right. Colors: matte black card surface, brushed silver metallic all raised embossed elements. Ultra realistic luxury card design, no background.",
        "file": "logo-v6-card-lab-gpt2.png",
        "w": 1280,
        "h": 800
    }
]

results = []
for p in prompts:
    print(f"Generating {p['file']} with {p['model']}...")
    try:
        payload = {
            "model": p["model"],
            "prompt": p["prompt"],
            "width": p["w"],
            "height": p["h"],
            "negative_prompt": "white background, blurry, cartoon, illustration, watermark, text errors, misspelled, square, vertical"
        }
        resp = requests.post(
            "https://api.venice.ai/api/v1/image/generate",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=180
        )
        data = resp.json()
        if "data" in data and len(data["data"]) > 0:
            img = data["data"][0]
            if "b64_json" in img:
                filepath = f"{OUT_DIR}/{p['file']}"
                img_bytes = base64.b64decode(img["b64_json"])
                with open(filepath, "wb") as f:
                    f.write(img_bytes)
                print(f"  Saved {p['file']} ({len(img_bytes)//1024}KB)")
                results.append(p['file'])
            elif "url" in img:
                import urllib.request
                filepath = f"{OUT_DIR}/{p['file']}"
                urllib.request.urlretrieve(img["url"], filepath)
                print(f"  Saved {p['file']} from URL")
                results.append(p['file'])
            else:
                print(f"  No image data: {list(img.keys())}")
        else:
            print(f"  Error: {str(data)[:300]}")
    except Exception as e:
        print(f"  Exception: {e}")

print(f"\nGenerated {len(results)} images: {results}")
