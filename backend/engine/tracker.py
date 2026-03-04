"""
tracker.py
──────────
Saves a completed attempt to attempts.db.
"""

import json
import uuid
from datetime import datetime, timezone
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import get_attempts_conn, init_attempts_db


def save_attempt(result: dict, section_times: dict) -> str:
    """
    Persist a completed attempt.
    result        : output from evaluator.evaluate()
    section_times : { section_name: seconds_taken }
    Returns the attempt_id.
    """
    init_attempts_db()

    attempt_id  = str(uuid.uuid4())[:8]
    now         = datetime.now(timezone.utc).isoformat()

    # Merge time taken into section_stats for storage
    section_data = result["section_stats"].copy()
    for section, secs in section_times.items():
        if section in section_data:
            section_data[section]["time_taken_secs"] = secs

    conn = get_attempts_conn()

    conn.execute(
        """
        INSERT INTO attempts (attempt_id, started_at, finished_at, total_score, total_qs, section_data)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            attempt_id,
            now,
            now,
            result["total_correct"],
            result["total_questions"],
            json.dumps(section_data),
        ),
    )

    for pq in result["per_question"]:
        correct_flag = {"correct": 1, "wrong": 0, "skipped": -1}[pq["result"]]
        conn.execute(
            """
            INSERT INTO answers (attempt_id, q_id, section, topic, user_answer, correct)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                attempt_id,
                pq["q_id"],
                pq["section"],
                pq["topic"],
                pq.get("user_answer") or "",
                correct_flag,
            ),
        )

    conn.commit()
    conn.close()

    print(f"[tracker] Attempt saved: {attempt_id}")
    return attempt_id


def get_all_attempts() -> list[dict]:
    """Return summary of all past attempts, newest first."""
    init_attempts_db()
    conn = get_attempts_conn()
    rows = conn.execute(
        "SELECT * FROM attempts ORDER BY finished_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_attempt_detail(attempt_id: str) -> dict | None:
    """Return full detail of one attempt including per-question answers."""
    init_attempts_db()
    conn = get_attempts_conn()

    attempt = conn.execute(
        "SELECT * FROM attempts WHERE attempt_id = ?", (attempt_id,)
    ).fetchone()

    if not attempt:
        conn.close()
        return None

    answers = conn.execute(
        "SELECT * FROM answers WHERE attempt_id = ?", (attempt_id,)
    ).fetchall()

    conn.close()

    return {
        **dict(attempt),
        "section_data": json.loads(attempt["section_data"]),
        "answers":      [dict(a) for a in answers],
    }
