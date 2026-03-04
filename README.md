# TCS NQT Practice App

A local mock test app for the TCS National Qualifier Test. It extracts questions from a real TCS NQT paper PDF, stores them in a question bank, and serves a full timed mock exam through a React frontend backed by a FastAPI server.

---

## What it does

- Runs a full 83-question mock test across 6 sections, timed at 190 minutes
- Shuffles questions and options on every test attempt
- Renders math symbols and LaTeX expressions using KaTeX
- Shows a results page with section breakdown, topic analysis, and a per-question response sheet
- Stores every attempt locally so you can review past performance

---

## Project structure

```
tcs-nqt/
├── question_bank/          # PDF extraction pipeline
│   ├── extractor/          # PDF reader, parser, text cleaner
│   ├── bank/               # Schema, builder, SQLite storage
│   └── main.py             # Run this to build the question bank
│
├── backend/                # FastAPI server
│   ├── engine/
│   │   ├── generator.py    # Assembles a test from the question bank
│   │   ├── evaluator.py    # Scores answers, builds result breakdown
│   │   └── tracker.py      # Saves attempts to SQLite
│   ├── routes/
│   │   ├── test.py         # POST /test/start, POST /test/submit
│   │   └── results.py      # GET /results/history
│   ├── question_bank.db    # Read-only question bank (pre-built)
│   ├── attempts.db         # Created automatically on first run
│   └── main.py             # Entry point: uvicorn main:app
│
└── frontend/               # React + Vite
    └── src/
        ├── pages/          # Home, Test, Results
        ├── components/     # QuestionCard, SectionNav, Timer
        ├── api.js          # Fetch wrappers for the backend
        └── index.css       # Global styles and CSS variables
```

---

## Setup

### 1. Build the question bank (first time only)

```bash
cd question_bank
pip install -r requirements.txt
# Place your TCS NQT PDF in input_pdfs/
python main.py
```

This creates `question_bank.db`. Copy it into `backend/`.

If you need to inspect or fix questions manually:

```bash
python verify_bank.py                          # review all questions
python verify_bank.py --section "Numerical Ability"
python verify_bank.py --no-answer              # find questions missing answers
```

### 2. Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Server starts at `http://localhost:8000`. On startup it prints the question count per section.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App opens at `http://localhost:5173`.

---

## Exam pattern

| Part   | Section               | Questions | Time       |
|--------|-----------------------|-----------|------------|
| Part A | Numerical Ability     | 20        | 25 mins    |
| Part A | Verbal Ability        | 25        | 25 mins    |
| Part A | Reasoning Ability     | 20        | 25 mins    |
| Part B | Advanced Quantitative | 15        | 25 mins *  |
| Part B | Advanced Logical      | 15        | 25 mins *  |
| Part B | Advanced Coding       | 2         | 90 mins    |

*Part B Quantitative and Logical share a single 25-minute timer in the real exam.

---

## Known limitations

- The app is single-user and local only. Sessions are stored in memory and lost on server restart.
- The question bank currently holds 48 questions extracted from one paper. Six questions have empty option arrays and are skipped during test generation.
- Answer matching uses exact text comparison after normalization. Some questions with complex math answers may still mismatch.
- The coding section displays problems but does not have a code execution environment.

---

## Dependencies

**Backend:** FastAPI, Uvicorn, pdfplumber, Pydantic  
**Frontend:** React 18, Vite, KaTeX (via CDN)
