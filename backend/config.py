import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # → D:\dsa\tcs_nqt\nqt_tester\backend

# Go one level up to nqt_tester/, then into question_bank/data/
QUESTION_BANK_DB = os.path.join(BASE_DIR, "..", "question_bank", "data", "question_bank.db")

# attempts.db lives right inside backend/
ATTEMPTS_DB = os.path.join(BASE_DIR, "attempts.db")

EXAM_PATTERN = {
    "Part A": {
        "Numerical Ability":  {"questions": 20, "time_mins": 25},
        "Verbal Ability":     {"questions": 25, "time_mins": 25},
        "Reasoning Ability":  {"questions": 20, "time_mins": 25},
    },
    "Part B": {
        "Advanced Quantitative": {"questions": 15, "time_mins": 25, "shared_timer": True},
        "Advanced Logical":      {"questions": 15, "time_mins": 25, "shared_timer": True},
        "Advanced Coding":       {"questions": 2,  "time_mins": 90},
    },
}

# Flat section → time map for quick lookup
SECTION_TIME = {
    "Numerical Ability":     25,
    "Verbal Ability":        25,
    "Reasoning Ability":     25,
    "Advanced Quantitative": 25,
    "Advanced Logical":      25,
    "Advanced Coding":       90,
}

SECTION_QCOUNT = {
    "Numerical Ability":     20,
    "Verbal Ability":        25,
    "Reasoning Ability":     20,
    "Advanced Quantitative": 15,
    "Advanced Logical":      15,
    "Advanced Coding":        2,
}
