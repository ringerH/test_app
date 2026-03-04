"""
main.py
───────
FastAPI app entry point.
Run with:  uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.test     import router as test_router
from routes.results  import router as results_router
from db              import get_question_counts, init_attempts_db

app = FastAPI(title="TCS NQT Practice App")

# ── CORS (allow React frontend on localhost:5173) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(test_router)
app.include_router(results_router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    init_attempts_db()
    print("[startup] Attempts DB initialized")

    counts = get_question_counts()
    print("[startup] Question bank loaded:")
    for section, count in counts.items():
        print(f"  {section}: {count} questions")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    counts = get_question_counts()
    return {
        "status":  "ok",
        "message": "TCS NQT Backend is running",
        "question_bank": counts,
    }
