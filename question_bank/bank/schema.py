"""
schema.py
─────────
Single source of truth for what a Question looks like.
"""

from dataclasses import dataclass, field, asdict
import hashlib
import json


@dataclass
class Question:
    section:  str
    question: str
    options:  list
    answer:   str
    source:   str
    topic:    str = ""          # filled in by builder.py
    q_id:     str = ""          # SHA-1 hash, filled in by builder.py

    def to_dict(self) -> dict:
        return asdict(self)


def make_id(question_text: str, source: str) -> str:
    """Stable unique ID based on question text + source file."""
    raw = f"{source}|{question_text.strip().lower()}"
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def dict_to_question(d: dict) -> Question:
    return Question(
        section=d.get("section", "Unknown"),
        question=d.get("question", ""),
        options=d.get("options", []),
        answer=d.get("answer", ""),
        source=d.get("source", ""),
        topic=d.get("topic", ""),
        q_id=d.get("q_id", ""),
    )
