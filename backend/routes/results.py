"""
routes/results.py
─────────────────
GET /results/history          → all past attempts
GET /results/attempt/{id}     → detail of one attempt
GET /results/analysis         → aggregated accuracy by topic across all attempts
"""

from fastapi import APIRouter, HTTPException
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.tracker import get_all_attempts, get_attempt_detail
from db import get_attempts_conn, init_attempts_db

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/history")
def history():
    """Return all past attempts, newest first."""
    attempts = get_all_attempts()
    return {"attempts": attempts}


@router.get("/attempt/{attempt_id}")
def attempt_detail(attempt_id: str):
    """Return full detail of a single attempt."""
    detail = get_attempt_detail(attempt_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    return detail


@router.get("/analysis")
def analysis():
    """
    Aggregate accuracy by topic and section across ALL attempts.
    Useful for identifying weak areas over time.
    """
    init_attempts_db()
    conn = get_attempts_conn()

    rows = conn.execute(
        """
        SELECT   topic, section,
                 COUNT(*)                          AS total,
                 SUM(CASE WHEN correct=1 THEN 1 ELSE 0 END) AS correct,
                 SUM(CASE WHEN correct=0 THEN 1 ELSE 0 END) AS wrong,
                 SUM(CASE WHEN correct=-1 THEN 1 ELSE 0 END) AS skipped
        FROM     answers
        GROUP BY topic, section
        ORDER BY section, topic
        """
    ).fetchall()
    conn.close()

    breakdown = []
    for row in rows:
        total   = row["total"]
        correct = row["correct"]
        breakdown.append({
            "section":  row["section"],
            "topic":    row["topic"],
            "total":    total,
            "correct":  correct,
            "wrong":    row["wrong"],
            "skipped":  row["skipped"],
            "accuracy": round((correct / total) * 100, 2) if total else 0,
        })

    return {"breakdown": breakdown}
