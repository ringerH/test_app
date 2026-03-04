"""
answer_normalizer.py
────────────────────
The DB stores answers in many inconsistent formats:
  - Letter only:        "C", "B", "c"
  - Letter + text:      "c ⅓, -⅓", "Option B - 6 sqrt 14", "Option C : 13:27"
  - Full option text:   "1475/126", "a graduate seeing things as they are"
  - Partial match:      "36 km"  →  option is "36",  "9 seconds" → option is "9"
  - Letter as answer:   "D"  →  maps to 4th option
  - No match:           ""   →  genuinely unknown

This module normalizes ALL of the above to the actual option text,
so the evaluator can do a simple string comparison.
"""

import re


# Map letter → 0-based index
LETTER_TO_IDX = {"a": 0, "b": 1, "c": 2, "d": 3}


def normalize(raw_answer: str, options: list[str]) -> str:
    """
    Given the raw answer string and the list of options,
    return the option text that best matches.
    Returns "" if no confident match found.
    """
    if not raw_answer or not options:
        return raw_answer or ""

    raw   = raw_answer.strip()
    lower = raw.lower()

    # ── 1. Single letter match  (A / B / C / D  or  a/b/c/d) ─────────────────
    if re.fullmatch(r"[a-dA-D]", raw):
        idx = LETTER_TO_IDX[raw.lower()]
        if idx < len(options):
            return options[idx]

    # ── 2. "Option B", "Option C : ..." , "option b - ..." ───────────────────
    m = re.match(r"option\s+([a-dA-D])", lower)
    if m:
        idx = LETTER_TO_IDX[m.group(1)]
        if idx < len(options):
            return options[idx]

    # ── 3. Letter prefix + text  "c ⅓, -⅓"  "B. some text" ──────────────────
    m = re.match(r"^([a-dA-D])[\.:\s]\s*(.+)$", raw)
    if m:
        idx      = LETTER_TO_IDX[m.group(1).lower()]
        leftover = m.group(2).strip()
        if idx < len(options):
            # Confirm the leftover text loosely matches the option
            if _loose_match(leftover, options[idx]):
                return options[idx]
            # If not, still trust the letter index (letter is more reliable)
            return options[idx]

    # ── 4. Exact match against an option ─────────────────────────────────────
    for opt in options:
        if _exact_match(raw, opt):
            return opt

    # ── 5. Partial / fuzzy match  "36 km" → "36",  "9 seconds" → "9" ─────────
    for opt in options:
        if _partial_match(raw, opt):
            return opt

    # ── 6. Numeric match  "9500" vs "9,500" ──────────────────────────────────
    raw_num = _extract_number(raw)
    if raw_num is not None:
        for opt in options:
            if _extract_number(opt) == raw_num:
                return opt

    # ── No match found — return raw as-is (will likely score as wrong) ────────
    return raw


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_str(s: str) -> str:
    """Lowercase, strip spaces and punctuation for loose comparison."""
    return re.sub(r"[\s\.,;:'\-–—]", "", s.lower())


def _exact_match(a: str, b: str) -> bool:
    return _normalize_str(a) == _normalize_str(b)


def _loose_match(a: str, b: str) -> bool:
    """True if a is contained in b or b is contained in a (normalized)."""
    na, nb = _normalize_str(a), _normalize_str(b)
    return na in nb or nb in na


def _partial_match(raw: str, opt: str) -> bool:
    """
    True if the core numeric/text content of raw matches opt.
    Handles cases like "36 km" matching "36", "9 seconds" matching "9",
    "13.475% ~ 13.5%" matching "13.5%"
    """
    nr, no = _normalize_str(raw), _normalize_str(opt)
    return no in nr or nr in no


def _extract_number(s: str):
    """Extract first number from string as float, or None."""
    m = re.search(r"[\d,]+\.?\d*", s.replace(",", ""))
    if m:
        try:
            return float(m.group().replace(",", ""))
        except ValueError:
            return None
    return None


# ── Batch normalize entire question bank ─────────────────────────────────────

def normalize_bank(db_path: str):
    """
    Read every question from the DB, normalize its answer,
    and update in place.
    """
    import sqlite3
    import json

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT q_id, options, answer FROM questions").fetchall()

    updated = 0
    for row in rows:
        options    = json.loads(row["options"])
        raw_answer = row["answer"]
        normalized = normalize(raw_answer, options)

        if normalized != raw_answer:
            conn.execute(
                "UPDATE questions SET answer = ? WHERE q_id = ?",
                (normalized, row["q_id"])
            )
            updated += 1

    conn.commit()
    conn.close()
    print(f"[normalizer] Updated {updated}/{len(rows)} answers")
