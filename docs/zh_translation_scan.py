#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass, asdict
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Dict, Tuple

ROOT = Path(__file__).resolve().parents[1]
ZH_ROOT = ROOT / "zh"
OUT_JSON = ROOT / "docs" / "zh-review-scan.json"

SKIP_TEXT_TAGS = {"script", "style", "noscript", "svg", "template"}
BLOCK_TAGS = {"p", "li", "div", "section", "article", "main", "header", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "td", "br"}

# Allowed English / brands / finance terms that may legitimately remain in zh pages.
ALLOWED_EXACT = {
    "APR", "BNPL", "CreditStud.io", "Credit Stud.io", "Target", "Amazon", "Walmart", "Costco",
    "Home Depot", "Lowe's", "Uber", "Lyft", "Uber Eats", "Drive Up", "Circle", "Prime",
    "Prime Visa", "Visa", "Mastercard", "Card", "CardName", "Amex", "Chase", "Citi", "Capital One",
    "Wells Fargo", "Discover", "Barclays", "Apple Card", "Apple", "Bank of America", "Bilt",
    "IHG", "Southwest", "DashPass", "DoorDash", "Instacart", "Hotels", "Travel", "Travel OneKeyCash",
    "Klarna", "Afterpay", "Affirm", "Sezzle", "Zip", "Cash App", "Google Pay", "Apple Pay",
    "YouTube", "Disney+", "Hulu", "Netflix", "Paramount+", "Max", "Peacock", "Spotify",
    "TSA PreCheck", "Global Entry", "Clear", "Turo", "Cell Phone", "Online", "Credit Karma",
    "FICO", "VantageScore", "FAQ", "FAQs", "EN", "English", "Español", "Tagalog", "한국어", "हिन्दी",
    "SavorOne", "Custom Cash", "DashPass", "Instacart+", "Ultimate Rewards", "World Elite Mastercard",
}

# Common untranslated UI or prose fragments that should be localized in body content.
SUSPICIOUS_PHRASES = {
    "Home", "Calculators", "Card Comparison", "Debt & Payoff", "Card Finder", "Learn", "Blog",
    "Compare credit cards, BNPL, and payment plans side by side", "Apply at", "Quick verdict",
    "Welcome bonus", "Intro APR", "Reg. APR", "Annual fee", "Overall", "Best for", "Skip if",
    "Frequently Asked Questions", "Marketplace coming soon", "Compare Credit Cards", "Rewards Calculator",
    "Card Reviews", "Loan vs Balance Transfer", "Minimum Payment Calculator", "Annual Fee Calculator",
    "Credit Score Simulator", "Debt Payoff Planner",
}

# Translated brand/bank names we do NOT want in translated pages.
BRAND_TRANSLATION_PATTERNS = {
    r"美国运通": "Amex should stay in English",
    r"运通": "Amex should stay in English",
    r"大通": "Chase should stay in English",
    r"花旗": "Citi should stay in English",
    r"第一资本": "Capital One should stay in English",
    r"富国": "Wells Fargo should stay in English",
    r"巴克莱": "Barclays should stay in English",
    r"美国银行": "Bank of America should stay in English",
    r"发现银行": "Discover should stay in English",
    r"苹果卡": "Apple Card should stay in English",
    r"亚马逊礼品卡": "Amazon gift card branding should keep Amazon in English",
}

SPANISH_CHARS_RE = re.compile(r"[áéíóúñ¿¡ÁÉÍÓÚÑ]")
ASCII_WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9+&'./-]*")
ASCII_PHRASE_RE = re.compile(r"[A-Za-z][A-Za-z0-9+&'./-]*(?:\s+[A-Za-z][A-Za-z0-9+&'./-]*)+")
NUMBER_RE = re.compile(r"\$\s?\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?%|\d+(?:[–-]\d+)+|\d[\d,]*(?:\.\d+)?(?:\+)?|\d+/\d+")

EXCLUDE_FROM_NUMERIC_DIFF = {
    "docs/translation-dashboard.html",
    "offline.html",
    "tools/api.html",
    "tools/index.html",
}


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.skip_stack: List[str] = []
        self.parts: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        if tag in SKIP_TEXT_TAGS or attrs.get("aria-hidden") == "true":
            self.skip_stack.append(tag)
            return
        if tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if self.skip_stack and self.skip_stack[-1] == tag:
            self.skip_stack.pop()
            return
        if tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.skip_stack:
            return
        text = data.strip()
        if text:
            self.parts.append(text)

    def text_lines(self) -> List[str]:
        text = " ".join(self.parts)
        text = re.sub(r"\s*\n\s*", "\n", text)
        text = re.sub(r"\n{2,}", "\n\n", text)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return lines


class StructureParser(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
    RAW_SKIP = {"script", "style", "noscript"}

    def __init__(self) -> None:
        super().__init__()
        self.tag_counts: Counter = Counter()
        self.stack: List[str] = []
        self.mismatches: List[str] = []
        self.skip_stack: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        self.tag_counts[tag] += 1
        if tag in self.RAW_SKIP:
            self.skip_stack.append(tag)
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag: str, attrs) -> None:
        self.tag_counts[tag] += 1

    def handle_endtag(self, tag: str) -> None:
        if self.skip_stack and self.skip_stack[-1] == tag:
            self.skip_stack.pop()
        if tag in self.VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
            return
        if tag in self.stack:
            # close through mismatched nesting
            idx = len(self.stack) - 1 - self.stack[::-1].index(tag)
            dangling = self.stack[idx + 1 :]
            if dangling:
                self.mismatches.append(f"closed {tag} with dangling children: {', '.join(dangling[:5])}")
            self.stack = self.stack[:idx]
            if self.stack and self.stack[-1] == tag:
                self.stack.pop()
            return
        self.mismatches.append(f"unexpected closing tag </{tag}>")


def normalize_num_token(token: str) -> str:
    token = token.replace(" ", "").replace("–", "-")
    token = token.rstrip(",.;:)")
    return token


def extract_body_html(text: str) -> str:
    m = re.search(r"<body\b[^>]*>(.*)</body>", text, re.I | re.S)
    return m.group(1) if m else text


def visible_lines(path: Path) -> List[str]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    parser = VisibleTextParser()
    parser.feed(extract_body_html(text))
    return parser.text_lines()


def visible_text(path: Path) -> str:
    return "\n".join(visible_lines(path))


def extract_numeric_tokens(text: str) -> List[str]:
    tokens = []
    for m in NUMBER_RE.findall(text):
        tok = normalize_num_token(m)
        if re.fullmatch(r"\d", tok):
            continue
        tokens.append(tok)
    return tokens


def should_ignore_english_token(token: str) -> bool:
    token = token.strip()
    if not token:
        return True
    if token in ALLOWED_EXACT:
        return True
    if re.fullmatch(r"[A-Z]{2,}", token):
        return True
    if re.fullmatch(r"[A-Za-z]", token):
        return True
    if re.fullmatch(r"\d+[xX]", token):
        return True
    return False


def find_untranslated_english(lines: List[str]) -> List[str]:
    hits: List[str] = []
    for line in lines:
        # Ignore pure language-switcher row.
        if line == "English Español 简体中文 Tagalog 한국어 हिन्दी":
            continue
        for phrase in SUSPICIOUS_PHRASES:
            if phrase in line:
                hits.append(f"phrase:{phrase} :: {line[:160]}")
        for phrase in ASCII_PHRASE_RE.findall(line):
            phrase = phrase.strip()
            if phrase in ALLOWED_EXACT:
                continue
            if phrase.startswith("CreditStud.io"):
                continue
            # ignore common brand-only sequences
            if all(should_ignore_english_token(tok) for tok in phrase.split()):
                continue
            hits.append(f"phrase:{phrase} :: {line[:160]}")
        # Also catch single UI words like Home / Learn already covered above.
        for token in ASCII_WORD_RE.findall(line):
            if should_ignore_english_token(token):
                continue
            if token in {"Home", "Learn", "Calculators", "Blog"}:
                hits.append(f"token:{token} :: {line[:160]}")
    # de-dupe while preserving order
    out: List[str] = []
    seen = set()
    for hit in hits:
        if hit not in seen:
            out.append(hit)
            seen.add(hit)
    return out


def find_spanish(lines: List[str]) -> List[str]:
    hits = []
    for line in lines:
        if line == "English Español 简体中文 Tagalog 한국어 हिन्दी":
            continue
        if SPANISH_CHARS_RE.search(line):
            hits.append(line[:160])
    return hits


def find_brand_translation_issues(lines: List[str]) -> List[str]:
    hits = []
    for line in lines:
        for pat, msg in BRAND_TRANSLATION_PATTERNS.items():
            if re.search(pat, line):
                hits.append(f"{msg} :: {line[:180]}")
    # de-dupe
    out = []
    seen = set()
    for hit in hits:
        if hit not in seen:
            out.append(hit)
            seen.add(hit)
    return out


def assess_structure(html: str) -> List[str]:
    parser = StructureParser()
    parser.feed(html)
    problems = []
    counts = parser.tag_counts
    if counts.get("html", 0) != 1:
        problems.append(f"html tag count is {counts.get('html', 0)}")
    if counts.get("body", 0) != 1:
        problems.append(f"body tag count is {counts.get('body', 0)}")
    if counts.get("header", 0) > 1:
        problems.append(f"header appears {counts['header']} times")
    if counts.get("main", 0) > 1:
        problems.append(f"main appears {counts['main']} times")
    if counts.get("footer", 0) > 1:
        problems.append(f"footer appears {counts['footer']} times")
    if parser.mismatches:
        problems.extend(parser.mismatches[:10])
    if parser.stack:
        tail = parser.stack[-10:]
        problems.append("unclosed tags at end: " + ", ".join(tail))
    return problems


def compare_numeric_tokens(rel_path: str, en_path: Path, zh_path: Path) -> List[str]:
    if rel_path in EXCLUDE_FROM_NUMERIC_DIFF:
        return []
    en_tokens = extract_numeric_tokens(visible_text(en_path))
    zh_tokens = extract_numeric_tokens(visible_text(zh_path))
    missing = sorted(set(en_tokens) - set(zh_tokens))
    extra = sorted(set(zh_tokens) - set(en_tokens))

    # Ignore trivial punctuation-only fallout from parser extraction or comma removal around prose.
    def keep(tok: str) -> bool:
        if tok in {"10", "12", "15", "21", "28", "30", "100", "200", "300", "500", "600", "650", "000", "00", "050"} and rel_path.startswith("blog/"):
            return False
        return True

    missing = [t for t in missing if keep(t)]
    extra = [t for t in extra if keep(t)]
    problems = []
    if missing or extra:
        if missing:
            problems.append("missing numeric tokens vs EN: " + ", ".join(missing[:8]))
        if extra:
            problems.append("extra numeric tokens vs EN: " + ", ".join(extra[:8]))
    return problems


@dataclass
class PageIssue:
    path: str
    untranslated_english: List[str]
    spanish: List[str]
    broken_html: List[str]
    brand_issues: List[str]
    numeric_issues: List[str]

    @property
    def issue_count(self) -> int:
        return sum(bool(x) for x in [self.untranslated_english, self.spanish, self.broken_html, self.brand_issues, self.numeric_issues])


def main() -> None:
    pages = sorted(ZH_ROOT.rglob("*.html"))
    results: List[PageIssue] = []
    for zh_path in pages:
        rel = zh_path.relative_to(ZH_ROOT).as_posix()
        lines = visible_lines(zh_path)
        html = zh_path.read_text(encoding="utf-8", errors="ignore")
        en_path = ROOT / rel
        untranslated = find_untranslated_english(lines)
        spanish = find_spanish(lines)
        broken = assess_structure(html)
        brand = find_brand_translation_issues(lines)
        numeric = compare_numeric_tokens(rel, en_path, zh_path) if en_path.exists() else ["missing English source file"]
        results.append(PageIssue(rel, untranslated, spanish, broken, brand, numeric))

    summary = {
        "pages_reviewed": len(results),
        "pages_with_any_issue": sum(1 for r in results if r.issue_count),
        "pages_with_untranslated_english": sum(1 for r in results if r.untranslated_english),
        "pages_with_spanish": sum(1 for r in results if r.spanish),
        "pages_with_broken_html": sum(1 for r in results if r.broken_html),
        "pages_with_brand_issues": sum(1 for r in results if r.brand_issues),
        "pages_with_numeric_issues": sum(1 for r in results if r.numeric_issues),
    }

    top_examples = {
        "untranslated_english": [asdict(r) for r in results if r.untranslated_english][:20],
        "spanish": [asdict(r) for r in results if r.spanish][:20],
        "broken_html": [asdict(r) for r in results if r.broken_html][:20],
        "brand_issues": [asdict(r) for r in results if r.brand_issues][:20],
        "numeric_issues": [asdict(r) for r in results if r.numeric_issues][:20],
    }

    payload = {
        "summary": summary,
        "results": [asdict(r) for r in results],
        "top_examples": top_examples,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
