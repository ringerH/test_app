"""
storage.py
──────────
Persists the question bank to:
  - data/question_bank.json   (human-readable, portable)
  - data/question_bank.db     (SQLite, for querying in the test app)
"""

import json
import sqlite3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import BANK_JSON, DB_PATH
from bank.schema import Question, dict_to_question


# ── JSON ──────────────────────────────────────────────────────────────────────

def save_json(bank: list[Question]):
    data = [q.to_dict() for q in bank]
    with open(BANK_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[storage] JSON saved → {BANK_JSON}  ({len(data)} questions)")


def load_json() -> list[Question]:
    if not os.path.exists(BANK_JSON):
        return []
    with open(BANK_JSON, encoding="utf-8") as f:
        data = json.load(f)
    return [dict_to_question(d) for d in data]


# ── SQLite ────────────────────────────────────────────────────────────────────

def _get_conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = _get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            q_id     TEXT PRIMARY KEY,
            section  TEXT,
            topic    TEXT,
            question TEXT,
            options  TEXT,      -- JSON array stored as string
            answer   TEXT,
            source   TEXT
        )
    """)
    conn.commit()
    conn.close()


def save_db(bank: list[Question]):
    init_db()
    conn = _get_conn()

    inserted = 0
    skipped = 0

    for q in bank:
        try:
            conn.execute(
                """INSERT OR IGNORE INTO questions
                   (q_id, section, topic, question, options, answer, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    q.q_id,
                    q.section,
                    q.topic,
                    q.question,
                    json.dumps(q.options),
                    q.answer,
                    q.source,
                ),
            )
            if conn.execute("SELECT changes()").fetchone()[0]:
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"[storage] DB insert error for q_id={q.q_id}: {e}")

    conn.commit()
    conn.close()
    print(f"[storage] DB saved → {DB_PATH}  (inserted={inserted}, skipped={skipped})")


def load_db() -> list[Question]:
    """Load all questions from SQLite as Question objects."""
    if not os.path.exists(DB_PATH):
        return []
    conn = _get_conn()
    rows = conn.execute("SELECT * FROM questions").fetchall()
    conn.close()

    questions = []
    for row in rows:
        q_id, section, topic, question, options_str, answer, source = row
        questions.append(Question(
            q_id=q_id,
            section=section,
            topic=topic,
            question=question,
            options=json.loads(options_str),
            answer=answer,
            source=source,
        ))
    return questions


def query_by_section(section: str) -> list[Question]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM questions WHERE section = ?", (section,)
    ).fetchall()
    conn.close()
    return [Question(q_id=r[0], section=r[1], topic=r[2], question=r[3],
                     options=json.loads(r[4]), answer=r[5], source=r[6])
            for r in rows]


def query_by_topic(topic: str) -> list[Question]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM questions WHERE topic = ?", (topic,)
    ).fetchall()
    conn.close()
    return [Question(q_id=r[0], section=r[1], topic=r[2], question=r[3],
                     options=json.loads(r[4]), answer=r[5], source=r[6])
            for r in rows]
