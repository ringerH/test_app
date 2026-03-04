"""
cleaner.py
──────────
Normalises raw extracted text so the parser has consistent input.
Fixes: encoding artifacts, extra whitespace, bullet symbols, etc.
"""

import re


# Characters that pdfplumber sometimes outputs instead of real bullets / dashes
BULLET_REPLACEMENTS = {
    "\u2022": "-",   # •
    "\u2013": "-",   # –
    "\u2014": "-",   # —
    "\u00b7": "-",   # ·
    "\uf0b7": "-",   # private-use bullet
    "\u25cf": "-",   # ●
}


def fix_encoding(text: str) -> str:
    """Replace known bad characters with clean equivalents."""
    for char, replacement in BULLET_REPLACEMENTS.items():
        text = text.replace(char, replacement)
    return text


def normalize_whitespace(text: str) -> str:
    """
    - Collapse multiple blank lines into one
    - Strip trailing spaces from each line
    """
    lines = text.splitlines()
    lines = [line.rstrip() for line in lines]

    cleaned = []
    blank_count = 0
    for line in lines:
        if line == "":
            blank_count += 1
            if blank_count <= 1:          # allow at most one blank line in a row
                cleaned.append(line)
        else:
            blank_count = 0
            cleaned.append(line)

    return "\n".join(cleaned)


def normalize_question_prefix(text: str) -> str:
    """
    Standardise question prefixes so the parser only needs one pattern.
    Examples normalised to  "Question N:"
        Q1:        → Question 1:
        Q. 3       → Question 3:
        Question3  → Question 3:
    """
    # "Q1:" / "Q 1." / "Q.1"
    text = re.sub(r"\bQ[\.\s]*(\d+)\s*[:\.]?", r"Question \1:", text)
    # "Question3:" (missing space)
    text = re.sub(r"\bQuestion(\d+)\s*[:\.]?", r"Question \1:", text)
    return text


def normalize_answer_prefix(text: str) -> str:
    """
    Standardise answer lines to  "Answer: ..."
        Ans –   → Answer:
        Ans:    → Answer:
        Answer– → Answer:
    """
    text = re.sub(r"\b(Ans(?:wer)?)\s*[:\-–]+\s*", "Answer: ", text, flags=re.IGNORECASE)
    return text


def clean(text: str) -> str:
    """Run all cleaning steps in order."""
    text = fix_encoding(text)
    text = normalize_whitespace(text)
    text = normalize_question_prefix(text)
    text = normalize_answer_prefix(text)
    return text
