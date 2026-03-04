"""
db.py
─────
Two databases:
  question_bank.db  — read-only, built by the extraction module
  attempts.db       — read-write, stores test attempts and results
"""

import sqlite3
import json
import os
from config import QUESTION_BANK_DB, ATTEMPTS_DB


# ── Question Bank (read-only) ─────────────────────────────────────────────────

def get_qbank_conn():
    if not os.path.exists(QUESTION_BANK_DB):
        raise FileNotFoundError(
            f"Question bank DB not found at: {QUESTION_BANK_DB}\n"
            f"Run the extraction module first to generate it."
        )
    conn = sqlite3.connect(QUESTION_BANK_DB)
    conn.row_factory = sqlite3.Row   # lets us access columns by name
    return conn


def fetch_questions_by_section(section: str, limit: int) -> list[dict]:
    """Pull `limit` random questions for a given section."""
    conn = get_qbank_conn()
    rows = conn.execute(
        """
        SELECT q_id, section, topic, question, options, answer
        FROM   questions
        WHERE  section = ?
        ORDER  BY RANDOM()
        LIMIT  ?
        """,
        (section, limit),
    ).fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "q_id":     row["q_id"],
            "section":  row["section"],
            "topic":    row["topic"],
            "question": row["question"],
            "options":  json.loads(row["options"]),
            "answer":   row["answer"],   # stripped out before sending to frontend
        })
    return result


def get_question_counts() -> dict:
    """Return how many questions exist per section in the bank."""
    conn = get_qbank_conn()
    rows = conn.execute(
        "SELECT section, COUNT(*) as cnt FROM questions GROUP BY section"
    ).fetchall()
    conn.close()
    return {row["section"]: row["cnt"] for row in rows}


# ── Attempts DB (read-write) ──────────────────────────────────────────────────

def get_attempts_conn():
    conn = sqlite3.connect(ATTEMPTS_DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_attempts_db():
    """Create attempts tables if they don't exist yet."""
    conn = get_attempts_conn()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            attempt_id   TEXT PRIMARY KEY,
            started_at   TEXT,
            finished_at  TEXT,
            total_score  INTEGER,
            total_qs     INTEGER,
            section_data TEXT    -- JSON: per-section scores + time taken
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS answers (
            attempt_id   TEXT,
            q_id         TEXT,
            section      TEXT,
            topic        TEXT,
            user_answer  TEXT,
            correct      INTEGER,   -- 1 = correct, 0 = wrong, -1 = skipped
            FOREIGN KEY (attempt_id) REFERENCES attempts(attempt_id)
        )
    """)

    conn.commit()
    conn.close()
