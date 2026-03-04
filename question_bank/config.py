import os

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR   = os.path.join(BASE_DIR, "input_pdfs")
RAW_DIR     = os.path.join(BASE_DIR, "data", "raw")
PARSED_DIR  = os.path.join(BASE_DIR, "data", "parsed")
DB_PATH     = os.path.join(BASE_DIR, "data", "question_bank.db")
BANK_JSON   = os.path.join(BASE_DIR, "data", "question_bank.json")

# ── Section names to detect in PDF text ───────────────────────────────────────
# Add / rename these if your other PDFs use different headings
SECTIONS = [
    "Numerical Ability",
    "Verbal Ability",
    "Reasoning Ability",
    "Advanced Coding",
    "Advanced Quantitative",
    "Advanced Logical",
]

# ── Regex patterns (used in parser.py) ────────────────────────────────────────
# Matches:  "Question 1:", "Question 2.", "Q1:", "Q 3."
QUESTION_PATTERN = r"(?:Question\s*\d+|Q\s*\d+)[:\.]"

# Matches option lines like:  "1. some text"  or  "A. some text"  or  "1) text"
OPTION_PATTERN = r"^(?:[1-4]|[A-Da-d])[\.|\)]\s+.+"

# Matches answer lines like:  "Answer: X"  "Ans: X"  "Ans – X"
ANSWER_PATTERN = r"^(?:Answer|Ans)\s*[:\-–]"
