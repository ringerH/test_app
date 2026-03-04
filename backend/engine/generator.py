"""
generator.py
────────────
Generates a full test following the TCS NQT exam pattern.
Shuffles questions and options before returning.
"""

import random
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import EXAM_PATTERN, SECTION_QCOUNT
from db import fetch_questions_by_section, get_question_counts


def shuffle_options(question: dict) -> dict:
    """
    Shuffle the options list and update the answer field to match new position.
    Answer is stored as the actual answer text (not index), so no remapping needed.
    """
    q = question.copy()
    random.shuffle(q["options"])
    return q


def strip_answer(question: dict) -> dict:
    """Remove the answer before sending to frontend."""
    q = question.copy()
    q.pop("answer", None)
    return q


def generate_test() -> dict:
    """
    Build a full test following EXAM_PATTERN.
    Returns:
    {
        "sections": [
            {
                "part":      "Part A",
                "section":   "Numerical Ability",
                "time_mins": 25,
                "questions": [ {...}, ... ]
            },
            ...
        ],
        "total_questions": 83,
        "total_time_mins": 190,
        "answers": { q_id: correct_answer }   ← kept server-side only
    }
    """
    available = get_question_counts()
    sections  = []
    answers   = {}   # q_id → correct answer, never sent to frontend

    for part_name, part_sections in EXAM_PATTERN.items():
        for section_name, meta in part_sections.items():
            needed   = meta["questions"]
            in_bank  = available.get(section_name, 0)

            # Warn but don't crash if bank has fewer questions than needed
            if in_bank < needed:
                print(
                    f"[generator] WARNING: {section_name} needs {needed} Q "
                    f"but bank only has {in_bank}. Using {in_bank}."
                )
                needed = in_bank

            raw_questions = fetch_questions_by_section(section_name, needed)

            # Shuffle options for each question
            questions_for_frontend = []
            for q in raw_questions:
                answers[q["q_id"]] = q["answer"]   # save correct answer
                q_shuffled = shuffle_options(q)
                q_clean    = strip_answer(q_shuffled)
                questions_for_frontend.append(q_clean)

            sections.append({
                "part":         part_name,
                "section":      section_name,
                "time_mins":    meta["time_mins"],
                "shared_timer": meta.get("shared_timer", False),
                "questions":    questions_for_frontend,
            })

    total_q    = sum(len(s["questions"]) for s in sections)
    total_time = 190   # fixed per exam pattern

    return {
        "sections":          sections,
        "total_questions":   total_q,
        "total_time_mins":   total_time,
        "answers":           answers,    # server keeps this, never returned to client
    }
