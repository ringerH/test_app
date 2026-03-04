"""
builder.py
──────────
Takes parsed question dicts from all PDFs, deduplicates them,
assigns IDs and auto-tags topics, returns a clean list of Question objects.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bank.schema import Question, make_id


# ── Simple keyword → topic mapping ────────────────────────────────────────────
# Extend this as needed for your other 9 PDFs
TOPIC_KEYWORDS = {
    "lcm":              "LCM/HCF",
    "hcf":              "LCM/HCF",
    "fraction":         "Fractions",
    "profit":           "Profit & Loss",
    "loss":             "Profit & Loss",
    "discount":         "Profit & Loss",
    "average":          "Averages",
    "ratio":            "Ratio & Proportion",
    "proportion":       "Ratio & Proportion",
    "speed":            "Time Speed Distance",
    "distance":         "Time Speed Distance",
    "train":            "Time Speed Distance",
    "time":             "Time & Work",
    "work":             "Time & Work",
    "interest":         "Simple & Compound Interest",
    "alloy":            "Alligation & Mixture",
    "mixture":          "Alligation & Mixture",
    "permutation":      "Permutation & Combination",
    "combination":      "Permutation & Combination",
    "probability":      "Probability",
    "mensuration":      "Mensuration",
    "area":             "Mensuration",
    "perimeter":        "Mensuration",
    "volume":           "Mensuration",
    "statistics":       "Statistics",
    "quartile":         "Statistics",
    "equation":         "Algebra",
    "quadratic":        "Algebra",
    "log":              "Logarithm",
    "series":           "Number Series",
    "sequence":         "Number Series",
    "grammar":          "Grammar",
    "error":            "Error Identification",
    "idiom":            "Idioms & Phrases",
    "sentence":         "Sentence Completion",
    "jumble":           "Para Jumble",
    "arrangement":      "Sentence Arrangement",
    "blood":            "Blood Relations",
    "relation":         "Blood Relations",
    "code":             "Coding & Decoding",
    "direction":        "Directions",
    "seating":          "Seating Arrangement",
    "syllogism":        "Syllogism",
    "statement":        "Statement & Conclusion",
    "argument":         "Statement & Argument",
}


def auto_tag_topic(question_text: str, section: str) -> str:
    """Return a topic string based on keywords found in the question."""
    text_lower = question_text.lower()
    for keyword, topic in TOPIC_KEYWORDS.items():
        if keyword in text_lower:
            return topic
    # Fallback: use section name as topic
    return section


def build_bank(all_parsed: list[dict]) -> list[Question]:
    """
    all_parsed : flat list of question dicts from all PDFs combined.
    Returns    : deduplicated list of Question objects with IDs + topics.
    """
    seen_ids = set()
    bank = []

    for d in all_parsed:
        q_text = d.get("question", "").strip()
        if not q_text:
            continue

        q_id = make_id(q_text, d.get("source", ""))

        # Skip duplicates (same question text + same source)
        if q_id in seen_ids:
            continue
        seen_ids.add(q_id)

        topic = auto_tag_topic(q_text, d.get("section", ""))

        q = Question(
            section=d.get("section", "Unknown"),
            question=q_text,
            options=d.get("options", []),
            answer=d.get("answer", ""),
            source=d.get("source", ""),
            topic=topic,
            q_id=q_id,
        )
        bank.append(q)

    print(f"[builder] Bank assembled: {len(bank)} unique questions")
    return bank
