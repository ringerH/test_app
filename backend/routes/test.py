"""
routes/test.py
──────────────
POST /test/start    → generate a fresh test
POST /test/submit   → evaluate + save attempt
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.generator import generate_test
from engine.evaluator import evaluate
from engine.tracker   import save_attempt

router = APIRouter(prefix="/test", tags=["test"])

# In-memory store for active test answers (keyed by attempt session)
# Simple for now — good enough for single-user local app
_active_answers: dict = {}


@router.post("/start")
def start_test():
    """
    Generate a new test.
    Returns sections + questions (without answers).
    Stores correct answers server-side.
    """
    test = generate_test()

    # Keep answers in memory, keyed by a simple session token
    import uuid
    session_id = str(uuid.uuid4())[:8]
    _active_answers[session_id] = {
        "answers":  test["answers"],
        "questions_meta": [
            q
            for section in test["sections"]
            for q in section["questions"]
        ],
    }

    # Don't return answers to frontend
    test.pop("answers")

    return {
        "session_id": session_id,
        "test":       test,
    }


class SubmitPayload(BaseModel):
    session_id:    str
    user_answers:  dict        # { q_id: selected_option_text }
    section_times: dict = {}   # { section_name: seconds_taken }  (optional)


@router.post("/submit")
def submit_test(payload: SubmitPayload):
    """
    Evaluate user answers and save the attempt.
    Returns full result breakdown.
    """
    session = _active_answers.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already submitted.")

    result = evaluate(
        user_answers    = payload.user_answers,
        correct_answers = session["answers"],
        questions_meta  = session["questions_meta"],
    )

    attempt_id = save_attempt(result, payload.section_times)

    # Clean up session from memory
    _active_answers.pop(payload.session_id, None)

    return {
        "attempt_id": attempt_id,
        "result":     result,
    }
