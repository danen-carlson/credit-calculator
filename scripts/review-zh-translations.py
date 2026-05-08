#!/usr/bin/env python3
import re
import json
import html
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
PAGES = [
    'about/index.html',
    'af-worth-it/index.html',
    'blog/best-credit-cards-for-groceries.html',
    'blog/klarna-vs-afterpay-vs-affirm.html',
    'cards/amazon-prime-visa-signature/index.html',
    'cards/amex-blue-cash-everyday/index.html',
    'cards/amex-blue-cash-preferred/index.html',
    'cards/amex-gold/index.html',
    'cards/amex-platinum/index.html',
    'cards/apple-card/index.html',
    'cards/barclays-uber-pro/index.html',
    'cards/bilt-mastercard/index.html',
    'cards/bofa-customized-cash-rewards/index.html',
    'cards/capital-one-savor/index.html',
    'cards/capital-one-savorone/index.html',
    'cards/capital-one-venture-x/index.html',
    'cards/chase-freedom-flex/index.html',
    'cards/chase-sapphire-preferred/index.html',
    'cards/chase-sapphire-reserve/index.html',
    'cards/citi-premier/index.html',
    'cards/citi-strata-premier/index.html',
    'cards/discover-it-cash-back/index.html',
    'cards/index.html',
    'cards/southwest-priority-card/index.html',
    'cards/us-bank-altitude-go/index.html',
    'cards/us-bank-cash-plus/index.html',
    'cards/wells-fargo-active-cash/index.html',
    'cards/wells-fargo-autograph/index.html',
    'compare/index.html',
    'debt-planner/index.html',
    'index.html',
    'loan-vs-bt/index.html',
    'merchant/amazon.html',
    'merchant/costco.html',
    'merchant/dining.html',
    'merchant/index.html',
    'merchant/insurance.html',
    'merchant/online-shopping.html',
    'merchant/rent.html',
    'merchant/restaurants.html',
    'merchant/streaming.html',
    'merchant/subscription.html',
    'merchant/target.html',
    'merchant/travel.html',
    'merchant/uber-lyft.html',
    'merchant/walmart.html',
    'merchant/warehouse-clubs.html',
    'rewards/index.html',
    'tools/index.html',
]

ALLOWED_ENGLISH_PHRASES = [
    'creditstud.io', 'amazon', 'whole foods', 'prime', 'prime day', 'visa', 'mastercard', 'master card',
    'amex', 'american express', 'capital one', 'citi', 'chase', 'discover', 'wells fargo', 'barclays',
    'apple', 'uber', 'lyft', 'bilt', 'costco', 'target', 'walmart', 'klarna', 'afterpay', 'affirm',
    'zip', 'sezzle', 'bnpl', 'apr', 'api', 'json', 'llm', 'llms', 'faq', 'q4', 'whole foods',
    'subscribe & save', 'the points guy', 'nerdwallet', 'wallethub', 'us bank', 'southwest',
    'amazon.com', 'ios', 'android', 'creditstud', 'prime visa', 'ultimate rewards', 'cash+',
]

ALLOWED_WORDS = {
    'amazon', 'prime', 'visa', 'mastercard', 'amex', 'chase', 'citi', 'discover', 'apple', 'uber',
    'lyft', 'bilt', 'klarna', 'afterpay', 'affirm', 'zip', 'sezzle', 'api', 'json', 'apr', 'faq',
    'q4', 'costco', 'target', 'walmart', 'creditstud', 'whole', 'foods', 'cash+', 'llm', 'llms'
}

SKIP_CLASS_PATTERNS = [
    'site-disclosure', 'top-nav', 'language-switcher', 'lang-dropdown', 'nav-dropdown', 'nav-hamburger',
    'footer', 'share', 'email-capture', 'newsletter', 'related-posts', 'author-box', 'cookie',
]
SKIP_ID_PATTERNS = ['footer', 'newsletter', 'share']
SKIP_TAGS = {'script', 'style', 'nav', 'footer', 'aside', 'noscript', 'svg'}
BLOCK_TAGS = {'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'td', 'th', 'dt', 'dd', 'figcaption', 'summary'}
SEMANTIC_DIV_CLASSES = {
    'stat-label', 'stat-value', 'rating-label', 'rating-value', 'result-name', 'result-type', 'result-total',
    'result-savings', 'detail-label', 'detail-value', 'result-notes', 'hero-title', 'hero-subtitle',
    'calc-card-title', 'calc-card-desc', 'step-item-title', 'step-item-desc', 'faq-card-title',
    'faq-card-desc', 'section-title', 'section-subtitle', 'issuer-tag', 'result-rank', 'good-note',
    'bad-note', 'note', 'summary', 'summary-text', 'label', 'value'
}


def normalize_space(text: str) -> str:
    text = html.unescape(text)
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def strip_comments(s: str) -> str:
    return re.sub(r'<!--.*?-->', '', s, flags=re.S)


def extract_body(html_text: str) -> str:
    m = re.search(r'<body\b[^>]*>(.*)</body>', html_text, re.I | re.S)
    return m.group(1) if m else html_text


def extract_fragment(html_text: str) -> str:
    body = strip_comments(extract_body(html_text))
    main_match = re.search(r'<main\b[^>]*>(.*?)</main>', body, re.I | re.S)
    main_fragment = main_match.group(1) if main_match else body

    hero_fragment = ''
    hero_match = re.search(r'<header\b[^>]*class="[^"]*card-hero[^"]*"[^>]*>(.*?)</header>', body, re.I | re.S)
    if hero_match:
        hero_fragment = hero_match.group(1)

    article_match = re.search(r'<article\b[^>]*>(.*?)</article>', main_fragment, re.I | re.S)
    if article_match:
        # Keep whole main, not only article, because many pages have useful intro/tables outside <article>
        pass

    return f"{hero_fragment}\n{main_fragment}" if hero_fragment else main_fragment


class VisibleTextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ignore_depth = 0
        self.blocks = []
        self.current = None
        self.counts = Counter()

    def _attrs_dict(self, attrs):
        return {k: v or '' for k, v in attrs}

    def _classes(self, attrs_dict):
        return {c for c in attrs_dict.get('class', '').split() if c}

    def _should_skip(self, tag, attrs_dict):
        if tag in SKIP_TAGS:
            return True
        classes = ' '.join(self._classes(attrs_dict)).lower()
        elem_id = attrs_dict.get('id', '').lower()
        for pat in SKIP_CLASS_PATTERNS:
            if pat in classes:
                return True
        for pat in SKIP_ID_PATTERNS:
            if pat in elem_id:
                return True
        return False

    def _collect_as_block(self, tag, attrs_dict):
        if tag in BLOCK_TAGS:
            return True
        if tag in {'div', 'span'}:
            classes = self._classes(attrs_dict)
            if classes & SEMANTIC_DIV_CLASSES:
                return True
        return False

    def handle_starttag(self, tag, attrs):
        attrs_dict = self._attrs_dict(attrs)
        should_skip = self._should_skip(tag, attrs_dict)
        self.stack.append((tag, attrs_dict, should_skip))
        if should_skip:
            self.ignore_depth += 1
            return
        self.counts[tag] += 1
        if tag == 'table':
            self.counts['table'] += 0
        if self.ignore_depth == 0 and self._collect_as_block(tag, attrs_dict):
            self.current = {'tag': tag, 'text_parts': []}

    def handle_endtag(self, tag):
        if not self.stack:
            return
        start_tag, attrs_dict, should_skip = self.stack.pop()
        if should_skip and self.ignore_depth > 0:
            self.ignore_depth -= 1
        if self.current and self.current['tag'] == tag:
            text = normalize_space(' '.join(self.current['text_parts']))
            if text:
                self.blocks.append({'tag': tag, 'text': text})
            self.current = None

    def handle_data(self, data):
        if self.ignore_depth > 0:
            return
        text = normalize_space(data)
        if not text:
            return
        if self.current:
            self.current['text_parts'].append(text)
        else:
            # standalone visible text node in a semantic container-less region
            self.blocks.append({'tag': '#text', 'text': text})


def parse_visible(html_fragment: str):
    parser = VisibleTextParser()
    parser.feed(html_fragment)
    blocks = []
    prev = None
    for block in parser.blocks:
        text = normalize_space(block['text'])
        if not text:
            continue
        if prev and prev['tag'] == block['tag'] == '#text':
            prev['text'] = normalize_space(prev['text'] + ' ' + text)
        else:
            prev = {'tag': block['tag'], 'text': text}
            blocks.append(prev)
    counts = Counter({k: v for k, v in parser.counts.items() if k in {'h1','h2','h3','h4','h5','h6','p','li','td','th','table'}})
    return blocks, counts


def financial_tokens(text: str):
    tokens = []
    for pattern in [
        r'\$\s?\d[\d,]*(?:\.\d+)?(?:\+)?',
        r'\b\d+(?:\.\d+)?%',
        r'\b\d+(?:\.\d+)?¢',
    ]:
        tokens.extend(re.findall(pattern, text))

    norm = []
    for token in tokens:
        t = token.replace(' ', '').strip('.,;:，。；：)】]')
        norm.append(t)
    return Counter(norm)


def clean_for_english_detection(text: str) -> str:
    cleaned = text.lower()
    cleaned = re.sub(r'https?://\S+|www\.\S+', ' ', cleaned)
    cleaned = re.sub(r'\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b', ' ', cleaned)
    cleaned = re.sub(r'`[^`]+`', ' ', cleaned)
    cleaned = re.sub(r'\b(get|post|put|delete|patch)\s+/\S+', ' ', cleaned)
    cleaned = re.sub(r'/[a-z0-9_?=&%./-]+', ' ', cleaned)
    for phrase in sorted(ALLOWED_ENGLISH_PHRASES, key=len, reverse=True):
        cleaned = cleaned.replace(phrase.lower(), ' ')
    cleaned = re.sub(r'\$\s?\d[\d,]*(?:\.\d+)?(?:\+)?', ' ', cleaned)
    cleaned = re.sub(r'\b\d+(?:\.\d+)?%\b', ' ', cleaned)
    cleaned = re.sub(r'\b\d+(?:\.\d+)?¢\b', ' ', cleaned)
    return cleaned


def is_probably_allowed_title_case(text: str) -> bool:
    words = re.findall(r'[A-Za-z][A-Za-z&+®.-]*', text)
    if not words or len(words) > 8:
        return False
    meaningful = [w for w in words if w.lower() not in {'and', 'or', 'for', 'the', 'of', 'to', 'at', 'in', 'on'}]
    if not meaningful:
        return False
    return all(w[0].isupper() or w.upper() == w for w in meaningful)


def english_fragments_in_zh(blocks):
    hits = []
    seen = set()
    for block in blocks:
        text = block['text']
        if re.fullmatch(r'[#\-–—\d\s$%.,+/()]+', text):
            continue
        cleaned = clean_for_english_detection(text)
        phrases = re.findall(r'[A-Za-z][A-Za-z&+®\-/]*(?:\s+[A-Za-z][A-Za-z&+®\-/]*){1,}', cleaned)
        phrases = [normalize_space(p) for p in phrases]
        phrases = [p for p in phrases if len(re.findall(r'[A-Za-z]+', p)) >= 2]
        if not phrases:
            continue
        if is_probably_allowed_title_case(text):
            continue
        filtered = []
        for phrase in phrases:
            words = [w.lower() for w in re.findall(r'[A-Za-z]+', phrase)]
            if all(w in ALLOWED_WORDS for w in words):
                continue
            filtered.append(phrase)
        if filtered:
            key = filtered[0].lower()
            if key not in seen:
                seen.add(key)
                hits.append({'text': text, 'fragments': filtered[:3]})
    return hits


def compare_page(rel_path: str):
    en_path = ROOT / rel_path
    zh_path = ROOT / 'zh' / rel_path
    en_html = en_path.read_text(encoding='utf-8')
    zh_html = zh_path.read_text(encoding='utf-8')

    en_blocks, en_counts = parse_visible(extract_fragment(en_html))
    zh_blocks, zh_counts = parse_visible(extract_fragment(zh_html))

    en_text = '\n'.join(b['text'] for b in en_blocks)
    zh_text = '\n'.join(b['text'] for b in zh_blocks)
    issues = []
    key_issues = []

    en_heading_count = sum(en_counts.get(k, 0) for k in ['h1','h2','h3','h4','h5','h6'])
    zh_heading_count = sum(zh_counts.get(k, 0) for k in ['h1','h2','h3','h4','h5','h6'])
    if zh_heading_count != en_heading_count:
        issues.append(f'MISSING CONTENT: headings count differs (en {en_heading_count}, zh {zh_heading_count})')
        key_issues.append('heading-count-mismatch')

    if zh_counts.get('p', 0) != en_counts.get('p', 0):
        issues.append(f'MISSING CONTENT: paragraph count differs (en {en_counts.get("p",0)}, zh {zh_counts.get("p",0)})')
        key_issues.append('paragraph-count-mismatch')

    if zh_counts.get('table', 0) != en_counts.get('table', 0):
        issues.append(f'MISSING CONTENT: table count differs (en {en_counts.get("table",0)}, zh {zh_counts.get("table",0)})')
        key_issues.append('table-count-mismatch')

    if len(zh_blocks) < max(5, int(len(en_blocks) * 0.8)):
        issues.append(f'MISSING CONTENT: visible text block count is much lower (en {len(en_blocks)}, zh {len(zh_blocks)})')
        key_issues.append('block-count-low')

    en_fin = financial_tokens(en_text)
    zh_fin = financial_tokens(zh_text)
    missing_fin = list((en_fin - zh_fin).elements())
    extra_fin = list((zh_fin - en_fin).elements())
    if missing_fin:
        sample = ', '.join(missing_fin[:8])
        issues.append(f'NUMBERS: financial tokens missing in zh: {sample}')
        key_issues.append('numbers-missing')
    if extra_fin:
        sample = ', '.join(extra_fin[:8])
        issues.append(f'NUMBERS: extra/different financial tokens in zh: {sample}')
        key_issues.append('numbers-extra')

    english_hits = english_fragments_in_zh(zh_blocks)
    if english_hits:
        sample = '; '.join(hit['text'][:120] for hit in english_hits[:5])
        issues.append(f'UNTRANSLATED TEXT: English remains in zh article content: {sample}')
        key_issues.append('english-leftover')

    # Accuracy heuristic: generic English headings should not remain untranslated, but card/product names are allowed.
    suspicious_headings = []
    generic_heading_words = {
        'quick', 'verdict', 'welcome', 'bonus', 'rewards', 'perks', 'fees', 'pros', 'cons', 'bottom',
        'line', 'overview', 'summary', 'faq', 'issuer', 'annual', 'fee', 'best', 'credit', 'cards',
        'creditstud', 'methodology', 'data', 'sources', 'transparency', 'tools'
    }
    for b in zh_blocks:
        if b['tag'] in {'h2','h3','h4','h5','h6'}:
            cleaned_heading = clean_for_english_detection(b['text'])
            heading_words = [w.lower() for w in re.findall(r'[A-Za-z]+', cleaned_heading)]
            if heading_words and any(w in generic_heading_words for w in heading_words):
                suspicious_headings.append(b['text'])
    if suspicious_headings:
        issues.append('ACCURACY: one or more generic section headings appear not fully localized: ' + '; '.join(suspicious_headings[:4]))
        key_issues.append('heading-localization')

    status = 'PASS' if not issues else 'FAIL'
    return {
        'page': rel_path,
        'status': status,
        'issue_count': len(issues),
        'key_issues': key_issues[:4],
        'issues': issues,
        'metrics': {
            'en_headings': en_heading_count,
            'zh_headings': zh_heading_count,
            'en_paragraphs': en_counts.get('p', 0),
            'zh_paragraphs': zh_counts.get('p', 0),
            'en_tables': en_counts.get('table', 0),
            'zh_tables': zh_counts.get('table', 0),
            'en_blocks': len(en_blocks),
            'zh_blocks': len(zh_blocks),
        },
    }


def print_table(results):
    page_width = max(len('Page'), max(len(r['page']) for r in results))
    status_width = len('Pass/Fail')
    issue_width = len('Issue Count')
    print(f"{'Page'.ljust(page_width)}  {'Pass/Fail'.ljust(status_width)}  {'Issue Count'.ljust(issue_width)}  Key Issues")
    print(f"{'-' * page_width}  {'-' * status_width}  {'-' * issue_width}  {'-' * 40}")
    for r in results:
        key = ', '.join(r['key_issues']) if r['key_issues'] else '-'
        print(f"{r['page'].ljust(page_width)}  {r['status'].ljust(status_width)}  {str(r['issue_count']).ljust(issue_width)}  {key}")


def main():
    results = [compare_page(page) for page in PAGES]
    out_json = ROOT / 'review' / 'zh-article-review.json'
    out_md = ROOT / 'review' / 'zh-article-review.md'
    out_json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')

    lines = []
    lines.append('# zh article review')
    lines.append('')
    lines.append('| Page | Pass/Fail | Issue Count | Key Issues |')
    lines.append('|---|---|---:|---|')
    for r in results:
        key = ', '.join(r['key_issues']) if r['key_issues'] else '-'
        lines.append(f"| {r['page']} | {r['status']} | {r['issue_count']} | {key} |")
    lines.append('')
    lines.append('## NEEDS_FIX')
    lines.append('')
    fails = [r for r in results if r['status'] == 'FAIL']
    if fails:
        for r in fails:
            lines.append(f"### {r['page']}")
            for issue in r['issues']:
                lines.append(f"- {issue}")
            lines.append('')
    else:
        lines.append('- None')
        lines.append('')
    lines.append('## PASS')
    lines.append('')
    for r in results:
        if r['status'] == 'PASS':
            lines.append(f"- {r['page']}")
    out_md.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    print_table(results)
    print('')
    print('NEEDS_FIX pages:')
    if fails:
        for r in fails:
            print(f"- {r['page']}")
            for issue in r['issues']:
                print(f"  - {issue}")
    else:
        print('- None')
    print('')
    print('PASS pages:')
    for r in results:
        if r['status'] == 'PASS':
            print(f"- {r['page']}")
    print('')
    print(f'Wrote {out_json}')
    print(f'Wrote {out_md}')


if __name__ == '__main__':
    main()
