"""
evaluator.py
────────────
Compares user answers against correct answers.
Returns a structured result with overall + per-section + per-topic breakdown.
"""


def evaluate(user_answers: dict, correct_answers: dict, questions_meta: list[dict]) -> dict:
    """
    user_answers    : { q_id: user_selected_option_text }
    correct_answers : { q_id: correct_answer_text }
    questions_meta  : [ { q_id, section, topic, ... } ]  — from the generated test

    Returns a result dict with full breakdown.
    """

    # Build a quick lookup: q_id → { section, topic }
    meta_map = {q["q_id"]: q for q in questions_meta}

    total_correct = 0
    total_wrong   = 0
    total_skipped = 0

    section_stats = {}   # section → { correct, wrong, skipped, total }
    topic_stats   = {}   # topic   → { correct, wrong, skipped, total }
    per_question  = []   # detailed per-question result

    for q_id, correct in correct_answers.items():
        meta    = meta_map.get(q_id, {})
        section = meta.get("section", "Unknown")
        topic   = meta.get("topic",   "Unknown")

        user_ans = user_answers.get(q_id, None)

        # Determine result
        if user_ans is None or user_ans == "":
            result = "skipped"
            total_skipped += 1
        elif _is_correct(user_ans, correct):
            result = "correct"
            total_correct += 1
        else:
            result = "wrong"
            total_wrong += 1

        # Section stats
        if section not in section_stats:
            section_stats[section] = {"correct": 0, "wrong": 0, "skipped": 0, "total": 0}
        section_stats[section][result] += 1
        section_stats[section]["total"] += 1

        # Topic stats
        if topic not in topic_stats:
            topic_stats[topic] = {"correct": 0, "wrong": 0, "skipped": 0, "total": 0}
        topic_stats[topic][result] += 1
        topic_stats[topic]["total"] += 1

        per_question.append({
            "q_id":       q_id,
            "section":    section,
            "topic":      topic,
            "user_answer":    user_ans,
            "correct_answer": correct,
            "result":     result,
        })

    total_qs = len(correct_answers)
    accuracy = round((total_correct / total_qs) * 100, 2) if total_qs else 0

    # Add accuracy % to each section
    for s, stats in section_stats.items():
        stats["accuracy"] = round(
            (stats["correct"] / stats["total"]) * 100, 2
        ) if stats["total"] else 0

    # Add accuracy % to each topic
    for t, stats in topic_stats.items():
        stats["accuracy"] = round(
            (stats["correct"] / stats["total"]) * 100, 2
        ) if stats["total"] else 0

    return {
        "total_questions": total_qs,
        "total_correct":   total_correct,
        "total_wrong":     total_wrong,
        "total_skipped":   total_skipped,
        "accuracy":        accuracy,
        "section_stats":   section_stats,
        "topic_stats":     topic_stats,
        "per_question":    per_question,
    }


def _is_correct(user_ans: str, correct_ans: str) -> bool:
    """
    Flexible match — handles cases where answer in DB is just a letter (A/B/C)
    or the full answer text.
    """
    u = user_ans.strip().lower()
    c = correct_ans.strip().lower()
    return u == c
