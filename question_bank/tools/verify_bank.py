"""
tools/verify_bank.py
────────────────────
Interactive terminal tool to audit the question bank.
Shows each question with its options and the normalized answer,
lets you flag bad entries and optionally fix them manually.

Usage:
    python tools/verify_bank.py                  # review all
    python tools/verify_bank.py --section "Numerical Ability"
    python tools/verify_bank.py --no-answer      # only questions with empty answer
"""

import sqlite3
import json
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bank.answer_normalizer import normalize


DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "question_bank", "data", "question_bank.db")


# ── ANSI colours (work on most terminals) ─────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"


def color(text, c): return f"{c}{text}{RESET}"


def print_question(idx, total, row, options, norm_answer):
    os.system("cls" if os.name == "nt" else "clear")

    print(color(f"\n  Question {idx}/{total}", BOLD))
    print(color(f"  Section : {row['section']}  |  Topic: {row['topic']}", DIM))
    print(color(f"  ID      : {row['q_id']}", DIM))
    print()
    print(color(f"  {row['question']}", CYAN))
    print()

    # Options with letter labels
    for i, opt in enumerate(options):
        letter = chr(65 + i)
        is_answer = norm_answer and opt.strip().lower() == norm_answer.strip().lower()
        prefix = color(f"  {letter}. ", GREEN if is_answer else RESET)
        suffix = color("  ← answer", GREEN) if is_answer else ""
        print(f"{prefix}{opt}{suffix}")

    print()
    print(color(f"  Raw answer   : {repr(row['answer'])}", YELLOW))
    print(color(f"  Norm answer  : {repr(norm_answer)}", GREEN if norm_answer else RED))

    # Flag if answer doesn't match any option
    if norm_answer and norm_answer not in options:
        print(color(f"  ⚠  Normalized answer not found in options!", RED))
    if not norm_answer:
        print(color(f"  ⚠  No answer — needs manual entry", RED))

    print()
    print(color("  [Enter] next  [s] skip section  [f] flag  [e] edit answer  [q] quit", DIM))


def run(section_filter=None, no_answer_only=False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    query = "SELECT * FROM questions"
    params = []
    if section_filter:
        query  += " WHERE section = ?"
        params  = [section_filter]
    if no_answer_only:
        connector = "AND" if section_filter else "WHERE"
        query    += f" {connector} (answer = '' OR answer IS NULL)"

    rows  = conn.execute(query, params).fetchall()
    total = len(rows)

    if total == 0:
        print("No questions found with those filters.")
        conn.close()
        return

    flagged = []
    idx     = 0

    while idx < total:
        row     = rows[idx]
        options = json.loads(row["options"])
        norm    = normalize(row["answer"], options)

        print_question(idx + 1, total, row, options, norm)

        cmd = input("  > ").strip().lower()

        if cmd == "q":
            break
        elif cmd == "s":
            # Skip to next section
            current_section = row["section"]
            while idx < total and rows[idx]["section"] == current_section:
                idx += 1
        elif cmd == "f":
            flagged.append({"q_id": row["q_id"], "question": row["question"][:60]})
            print(color("  Flagged!", YELLOW))
            idx += 1
        elif cmd == "e":
            new_ans = input("  Enter correct answer (exact option text): ").strip()
            if new_ans:
                conn.execute("UPDATE questions SET answer = ? WHERE q_id = ?",
                             (new_ans, row["q_id"]))
                conn.commit()
                print(color(f"  Updated answer to: {new_ans}", GREEN))
            idx += 1
        else:
            idx += 1

    conn.close()

    print(f"\n  Done. Reviewed {min(idx, total)}/{total} questions.")
    if flagged:
        print(color(f"\n  Flagged {len(flagged)} questions:", YELLOW))
        for f in flagged:
            print(f"    [{f['q_id']}] {f['question']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify question bank answers")
    parser.add_argument("--section",    type=str, help="Filter by section name")
    parser.add_argument("--no-answer",  action="store_true", help="Only show questions with empty answer")
    args = parser.parse_args()

    run(section_filter=args.section, no_answer_only=args.no_answer)
