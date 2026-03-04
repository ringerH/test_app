"""
parser.py
─────────
Converts cleaned text into a list of question dicts.

Each question dict looks like:
{
    "section":  "Numerical Ability",
    "question": "What is the sum of ...",
    "options":  ["1475/252", "1475/126", "625/252", "625/126"],
    "answer":   "1475/126",
    "source":   "TCS-NQT-Paper-1.pdf"
}
"""

import re
import os
from config import SECTIONS, QUESTION_PATTERN, OPTION_PATTERN, ANSWER_PATTERN, PARSED_DIR
import json


# ── Helpers ───────────────────────────────────────────────────────────────────

def detect_section(line: str) -> str | None:
    """Return the section name if this line is a section heading, else None."""
    line_stripped = line.strip()
    for section in SECTIONS:
        if section.lower() in line_stripped.lower():
            return section
    return None


def is_question_start(line: str) -> bool:
    return bool(re.match(QUESTION_PATTERN, line.strip(), re.IGNORECASE))


def is_option_line(line: str) -> bool:
    return bool(re.match(OPTION_PATTERN, line.strip()))


def is_answer_line(line: str) -> bool:
    return bool(re.match(ANSWER_PATTERN, line.strip(), re.IGNORECASE))


def extract_option_text(line: str) -> str:
    """Strip leading  '1. ' / 'A. ' / '1) '  from an option line."""
    return re.sub(r"^(?:[1-4]|[A-Da-d])[\.|\)]\s+", "", line.strip())


def extract_answer_text(line: str) -> str:
    """Strip  'Answer: '  prefix."""
    return re.sub(ANSWER_PATTERN, "", line.strip(), flags=re.IGNORECASE).strip()


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_text(text: str, source: str = "") -> list[dict]:
    """
    Walk through the cleaned text line by line and assemble question dicts.
    Returns a list of question dicts.
    """
    questions = []
    current_section = "Unknown"

    # State for the question being built
    current_q = None

    def save_current():
        """Push current_q to questions if it has the minimum required fields."""
        if current_q and current_q.get("question"):
            questions.append(current_q)

    lines = text.splitlines()
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # ── Section heading ───────────────────────────────────────────────────
        section = detect_section(line)
        if section:
            current_section = section
            i += 1
            continue

        # ── New question starts ───────────────────────────────────────────────
        if is_question_start(line):
            save_current()

            # Grab the question text (may continue on next lines)
            q_text = re.sub(QUESTION_PATTERN, "", line, flags=re.IGNORECASE).strip()

            # Consume continuation lines (not options, not answers, not new questions)
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                if (not next_line
                        or is_question_start(next_line)
                        or is_option_line(next_line)
                        or is_answer_line(next_line)
                        or detect_section(next_line)):
                    break
                q_text += " " + next_line
                i += 1

            current_q = {
                "section":  current_section,
                "question": q_text.strip(),
                "options":  [],
                "answer":   "",
                "source":   source,
            }
            continue

        # ── Option line ───────────────────────────────────────────────────────
        if is_option_line(line) and current_q is not None:
            current_q["options"].append(extract_option_text(line))
            i += 1
            continue

        # ── Answer line ───────────────────────────────────────────────────────
        if is_answer_line(line) and current_q is not None:
            ans = extract_answer_text(line)

            # Answer may spill onto the next line
            if not ans and i + 1 < len(lines):
                i += 1
                ans = lines[i].strip()

            current_q["answer"] = ans
            i += 1
            continue

        i += 1

    # Don't forget the last question
    save_current()

    return questions


# ── Per-PDF entry point ───────────────────────────────────────────────────────

def parse_pdf_text(text: str, source: str) -> list[dict]:
    """Parse cleaned text for one PDF and save intermediate JSON."""
    os.makedirs(PARSED_DIR, exist_ok=True)

    questions = parse_text(text, source=source)
    print(f"[parser] {source} → {len(questions)} questions parsed")

    # Save per-PDF parsed output for easy inspection / debugging
    out_path = os.path.join(PARSED_DIR, source.replace(".pdf", ".json"))
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    return questions
