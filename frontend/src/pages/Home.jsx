import { useState } from "react"
import { startTest } from "../api"

export default function Home({ onStart }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const EXAM_INFO = [
    { part: "Part A", section: "Numerical Ability",      questions: 20, time: "25 mins" },
    { part: "Part A", section: "Verbal Ability",         questions: 25, time: "25 mins" },
    { part: "Part A", section: "Reasoning Ability",      questions: 20, time: "25 mins" },
    { part: "Part B", section: "Advanced Quantitative",  questions: 15, time: "25 mins (shared)" },
    { part: "Part B", section: "Advanced Logical",       questions: 15, time: "25 mins (shared)" },
    { part: "Part B", section: "Advanced Coding",        questions: 2,  time: "90 mins" },
  ]

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const data = await startTest()
      onStart(data.session_id, data.test)
    } catch (e) {
      setError("Could not connect to backend. Make sure uvicorn is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>TCS NQT 2026</div>
          <h1 style={styles.title}>Practice Test</h1>
          <p style={styles.subtitle}>Full mock exam · 83 questions · 190 minutes</p>
        </div>

        {/* Exam pattern table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Part</th>
              <th style={styles.th}>Section</th>
              <th style={styles.th}>Questions</th>
              <th style={styles.th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {EXAM_INFO.map((row, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.td}><span style={row.part === "Part B" ? styles.partB : styles.partA}>{row.part}</span></td>
                <td style={styles.td}>{row.section}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>{row.questions}</td>
                <td style={styles.td}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.btn} onClick={handleStart} disabled={loading}>
          {loading ? "Generating test..." : "Start Mock Test →"}
        </button>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "24px",
  },
  card: {
    background: "#1a1d27",
    border: "1px solid #2a2d3e",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "680px",
  },
  header: { textAlign: "center", marginBottom: "32px" },
  badge: {
    display: "inline-block",
    background: "#1e3a5f",
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "1.5px",
    padding: "4px 12px",
    borderRadius: "20px",
    marginBottom: "12px",
    textTransform: "uppercase",
  },
  title: { color: "#f1f5f9", fontSize: "28px", margin: "0 0 8px", fontWeight: 700 },
  subtitle: { color: "#64748b", fontSize: "14px", margin: 0 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "28px" },
  th: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid #2a2d3e",
  },
  td: { color: "#cbd5e1", fontSize: "14px", padding: "12px 12px" },
  rowEven: { background: "transparent" },
  rowOdd:  { background: "#ffffff05" },
  partA: {
    background: "#1e3a5f", color: "#60a5fa",
    padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600,
  },
  partB: {
    background: "#2d1f3d", color: "#a78bfa",
    padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600,
  },
  btn: {
    width: "100%",
    padding: "14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  error: {
    background: "#2d1515",
    color: "#f87171",
    border: "1px solid #7f1d1d",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    marginBottom: "16px",
  },
}
