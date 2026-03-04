"""
main.py
───────
Runs the full pipeline:
  1. Extract raw text from all PDFs
  2. Clean the text
  3. Parse into question dicts
  4. Build + deduplicate the question bank
  5. Save to JSON + SQLite
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from extractor.pdf_reader import extract_all_pdfs
from extractor.cleaner   import clean
from extractor.parser    import parse_pdf_text
from bank.builder        import build_bank
from bank.storage        import save_json, save_db


def run():
    print("=" * 50)
    print("  Question Bank Builder")
    print("=" * 50)

    # ── Step 1: Extract raw text from all PDFs ────────────────────────────────
    raw_texts = extract_all_pdfs()

    if not raw_texts:
        print("[main] Nothing to process. Drop PDFs into input_pdfs/ and re-run.")
        return

    # ── Step 2 & 3: Clean + Parse each PDF ───────────────────────────────────
    all_questions = []

    for filename, raw_text in raw_texts.items():
        print(f"\n[main] Processing: {filename}")
        cleaned = clean(raw_text)
        questions = parse_pdf_text(cleaned, source=filename)
        all_questions.extend(questions)

    print(f"\n[main] Total questions parsed across all PDFs: {len(all_questions)}")

    if not all_questions:
        print("[main] No questions found. Check your PDFs or parser patterns in config.py")
        return

    # ── Step 4: Build bank (deduplicate + tag) ────────────────────────────────
    bank = build_bank(all_questions)

    # ── Step 5: Save ──────────────────────────────────────────────────────────
    save_json(bank)
    save_db(bank)

    print("\n[main] Done!")
    print(f"  JSON : data/question_bank.json")
    print(f"  DB   : data/question_bank.db")


if __name__ == "__main__":
    run()
