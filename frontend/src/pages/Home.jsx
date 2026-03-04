import { useState } from "react"
import { startTest } from "../api"

const EXAM_INFO = [
  { part: "Part A", section: "Numerical Ability",      questions: 20, time: "25 mins" },
  { part: "Part A", section: "Verbal Ability",         questions: 25, time: "25 mins" },
  { part: "Part A", section: "Reasoning Ability",      questions: 20, time: "25 mins" },
  { part: "Part B", section: "Advanced Quantitative",  questions: 15, time: "25 mins (shared)" },
  { part: "Part B", section: "Advanced Logical",       questions: 15, time: "25 mins (shared)" },
  { part: "Part B", section: "Advanced Coding",        questions: 2,  time: "90 mins" },
]

export default function Home({ onStart }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const data = await startTest()
      onStart(data.session_id, data.test)
    } catch {
      setError("Could not connect to backend. Make sure uvicorn is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-header">
          <span className="home-badge">TCS NQT 2026</span>
          <h1 className="home-title">Practice Test</h1>
          <p className="home-sub">Full mock exam · 83 questions · 190 minutes</p>
        </div>

        <div className="table-wrap">
          <table className="exam-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Section</th>
                <th className="col-center">Qs</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {EXAM_INFO.map((row, i) => (
                <tr key={i} className={i % 2 ? "row-odd" : ""}>
                  <td><span className={row.part === "Part B" ? "tag tag-b" : "tag tag-a"}>{row.part}</span></td>
                  <td>{row.section}</td>
                  <td className="col-center">{row.questions}</td>
                  <td>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button className="start-btn" onClick={handleStart} disabled={loading}>
          {loading ? "Generating test…" : "Start Mock Test →"}
        </button>
      </div>

      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .home-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: clamp(20px, 5vw, 40px);
          width: 100%; max-width: 680px;
        }
        .home-header { text-align: center; margin-bottom: 28px; }
        .home-badge {
          display: inline-block;
          background: #1e3a5f; color: var(--accent-lt);
          font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;
        }
        .home-title { color: var(--text); font-size: clamp(20px, 5vw, 28px); font-weight: 700; margin: 0 0 8px; }
        .home-sub   { color: var(--muted); font-size: 14px; }
        .table-wrap { overflow-x: auto; margin-bottom: 24px; -webkit-overflow-scrolling: touch; }
        .exam-table { width: 100%; min-width: 320px; border-collapse: collapse; }
        .exam-table th {
          color: var(--muted); font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px;
          padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .exam-table td { color: var(--soft); font-size: clamp(12px, 2vw, 14px); padding: 11px 12px; }
        .row-odd td { background: #ffffff05; }
        .col-center { text-align: center !important; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .tag-a { background: #1e3a5f; color: var(--accent-lt); }
        .tag-b { background: var(--purple-bg); color: var(--purple); }
        .error-box {
          background: #2d1515; color: var(--red); border: 1px solid #7f1d1d;
          border-radius: 8px; padding: 12px; font-size: 14px; margin-bottom: 16px;
        }
        .start-btn {
          display: block; width: 100%; padding: 14px;
          background: var(--accent); color: #fff; border: none;
          border-radius: 10px; font-size: clamp(14px, 3vw, 16px); font-weight: 600;
        }
        .start-btn:hover:not(:disabled) { background: #1d4ed8; }
        .start-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  )
}