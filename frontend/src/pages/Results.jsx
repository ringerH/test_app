import { useState } from "react"

export default function Results({ result, onHome }) {
  if (!result) return null

  const {
    total_correct, total_wrong, total_skipped,
    total_questions, accuracy, section_stats, topic_stats, per_question
  } = result

  const [tab, setTab]             = useState("summary")
  const [filterSection, setFS]    = useState("All")
  const [filterResult,  setFR]    = useState("All")

  const topics = Object.entries(topic_stats)
    .map(([topic, s]) => ({ topic, ...s }))
    .sort((a, b) => a.accuracy - b.accuracy)

  const sections = ["All", ...Object.keys(section_stats)]

  const filtered = (per_question || []).filter(q =>
    (filterSection === "All" || q.section === filterSection) &&
    (filterResult  === "All" || q.result  === filterResult)
  )

  return (
    <div className="results-page">
      <div className="results-container">

        {/* Score header */}
        <div className="results-header">
          <h1 className="results-title">Test Complete</h1>
          <div className="score-circle">
            <span className="score-num">{total_correct}</span>
            <span className="score-denom">/{total_questions}</span>
          </div>
          <span className="accuracy-badge">{accuracy}% accuracy</span>
        </div>

        {/* Stat boxes */}
        <div className="stat-row">
          <StatBox label="Correct" value={total_correct} color="var(--green)" />
          <StatBox label="Wrong"   value={total_wrong}   color="var(--red)"  />
          <StatBox label="Skipped" value={total_skipped} color="var(--muted)"/>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === "summary"   ? "tab--on" : ""}`} onClick={() => setTab("summary")}>
            📊 Summary
          </button>
          <button className={`tab ${tab === "responses" ? "tab--on" : ""}`} onClick={() => setTab("responses")}>
            📋 Response Sheet
          </button>
        </div>

        {/* ── Summary ── */}
        {tab === "summary" && <>
          <h2 className="sub-head">Section Breakdown</h2>
          <div className="section-grid">
            {Object.entries(section_stats).map(([name, s]) => (
              <div key={name} className="section-card">
                <div className="sc-name">{name}</div>
                <div className="sc-pct" style={{ color: accColor(s.accuracy) }}>{s.accuracy}%</div>
                <div className="bar"><div className="bar-fill" style={{ width: `${s.accuracy}%`, background: accColor(s.accuracy) }} /></div>
                <div className="sc-detail">
                  <span style={{ color: "var(--green)" }}>{s.correct}✓</span>
                  <span style={{ color: "var(--red)"   }}>{s.wrong}✗</span>
                  <span style={{ color: "var(--muted)" }}>{s.skipped}–</span>
                </div>
              </div>
            ))}
          </div>

          <h2 className="sub-head">Topic Analysis <span className="sub-note">(weakest first)</span></h2>
          <div className="topic-list">
            {topics.map(({ topic, accuracy: acc, correct, total }) => (
              <div key={topic} className="topic-row">
                <span className="topic-name">{topic}</span>
                <div className="topic-bar"><div className="topic-fill" style={{ width: `${acc}%`, background: accColor(acc) }} /></div>
                <span className="topic-pct" style={{ color: accColor(acc) }}>{acc}%</span>
                <span className="topic-frac">{correct}/{total}</span>
              </div>
            ))}
          </div>
        </>}

        {/* ── Response Sheet ── */}
        {tab === "responses" && <>
          <div className="filters">
            <div className="filter-row">
              <span className="filter-label">Section</span>
              <div className="filter-btns">
                {sections.map(s => (
                  <button key={s} className={`filter-btn ${filterSection === s ? "filter-btn--on" : ""}`} onClick={() => setFS(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="filter-row">
              <span className="filter-label">Result</span>
              <div className="filter-btns">
                {["All","correct","wrong","skipped"].map(r => (
                  <button key={r} className={`filter-btn ${filterResult === r ? "filter-btn--on" : ""}`} onClick={() => setFR(r)}>
                    {r === "correct" ? "✓ Correct" : r === "wrong" ? "✗ Wrong" : r === "skipped" ? "— Skipped" : "All"}
                  </button>
                ))}
              </div>
            </div>
            <span className="filter-count">Showing {filtered.length} of {per_question?.length || 0}</span>
          </div>

          <div className="response-list">
            {filtered.map((q, i) => <ResponseCard key={q.q_id} q={q} i={i} />)}
            {filtered.length === 0 && <div className="empty">No questions match the filter.</div>}
          </div>
        </>}

        <button className="home-btn" onClick={onHome}>← Back to Home</button>
      </div>

      <style>{`
        .results-page { min-height: 100vh; padding: clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px); }
        .results-container { max-width: 820px; margin: 0 auto; }

        .results-header { text-align: center; margin-bottom: 24px; }
        .results-title { color: var(--text); font-size: clamp(18px, 4vw, 24px); font-weight: 700; margin: 0 0 16px; }
        .score-circle {
          display: inline-flex; align-items: baseline; gap: 2px;
          background: var(--surface); border: 4px solid var(--accent);
          border-radius: 50%; width: clamp(90px, 20vw, 120px); height: clamp(90px, 20vw, 120px);
          justify-content: center; margin-bottom: 12px;
        }
        .score-num   { color: var(--text);  font-size: clamp(28px, 7vw, 42px); font-weight: 800; }
        .score-denom { color: var(--muted); font-size: clamp(14px, 4vw, 20px); }
        .accuracy-badge {
          display: inline-block;
          background: #1e3a5f; color: var(--accent-lt);
          padding: 4px 14px; border-radius: 20px;
          font-size: 14px; font-weight: 600;
        }

        .stat-row { display: flex; gap: clamp(8px, 2vw, 16px); margin-bottom: 24px; }
        .stat-box {
          flex: 1; background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: clamp(12px, 3vw, 20px); text-align: center;
        }
        .stat-num   { display: block; font-size: clamp(22px, 5vw, 32px); font-weight: 800; margin-bottom: 4px; }
        .stat-label { color: var(--muted); font-size: 13px; font-weight: 500; }

        .tabs { display: flex; gap: 8px; margin-bottom: 22px; }
        .tab {
          padding: 9px clamp(12px, 3vw, 20px);
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; color: var(--muted);
          font-size: clamp(12px, 2vw, 14px); font-weight: 600;
        }
        .tab--on { background: #1e3a5f; border-color: var(--accent); color: var(--accent-lt); }

        .sub-head { color: var(--text); font-size: 15px; font-weight: 700; margin: 0 0 14px; }
        .sub-note { color: var(--muted); font-weight: 400; font-size: 12px; }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .section-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .sc-name { color: var(--subtle); font-size: 12px; margin-bottom: 6px; }
        .sc-pct  { font-size: clamp(18px, 4vw, 22px); font-weight: 800; margin-bottom: 8px; }
        .bar      { height: 6px; background: var(--border); border-radius: 3px; margin-bottom: 10px; }
        .bar-fill { height: 100%; border-radius: 3px; }
        .sc-detail { display: flex; gap: 10px; font-size: 12px; }

        .topic-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
        .topic-row {
          display: flex; align-items: center; gap: 10px; flex-wrap: nowrap;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 11px 14px;
        }
        .topic-name { color: var(--soft); font-size: 13px; min-width: 0; flex: 1; word-break: break-word; }
        .topic-bar  { width: clamp(60px, 15vw, 140px); flex-shrink: 0; height: 6px; background: var(--border); border-radius: 3px; }
        .topic-fill { height: 100%; border-radius: 3px; }
        .topic-pct  { font-size: 13px; font-weight: 700; white-space: nowrap; min-width: 38px; text-align: right; }
        .topic-frac { color: var(--muted); font-size: 12px; white-space: nowrap; min-width: 36px; text-align: right; }

        /* Filters */
        .filters {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .filter-row  { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
        .filter-label { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding-top: 5px; min-width: 52px; }
        .filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-btn {
          padding: 4px 10px;
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 6px; color: var(--muted);
          font-size: clamp(11px, 2vw, 13px); font-weight: 500;
        }
        .filter-btn--on { background: #1e3a5f; border-color: var(--accent); color: var(--accent-lt); }
        .filter-count   { color: var(--muted2); font-size: 12px; }

        /* Response cards */
        .response-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 28px; }
        .empty         { color: var(--muted); text-align: center; padding: 32px; font-size: 14px; }

        .home-btn {
          padding: clamp(10px, 2vw, 12px) clamp(18px, 4vw, 28px);
          background: var(--surface); color: var(--accent-lt);
          border: 1px solid var(--accent); border-radius: 10px;
          font-size: 15px; font-weight: 600;
        }

        @media (max-width: 480px) {
          .topic-name { font-size: 12px; }
          .topic-bar  { display: none; }
        }
      `}</style>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="stat-box">
      <span className="stat-num" style={{ color }}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function ResponseCard({ q, i }) {
  const [open, setOpen] = useState(false)
  const borderColor = q.result === "correct" ? "#22c55e44" : q.result === "wrong" ? "#f8717144" : "#64748b33"
  const bgColor     = q.result === "correct" ? "#22c55e08" : q.result === "wrong" ? "#f8717108" : "#64748b08"
  const icon        = q.result === "correct" ? "✓" : q.result === "wrong" ? "✗" : "—"
  const iconColor   = q.result === "correct" ? "#22c55e"  : q.result === "wrong" ? "#f87171"  : "#64748b"

  return (
    <div style={{ border: `1px solid ${borderColor}`, background: bgColor, borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", cursor: "pointer" }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0, marginTop: 2,
          border: `2px solid ${iconColor}44`, background: `${iconColor}11`,
          color: iconColor, fontWeight: 800, fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ background: "#1e3a5f", color: "var(--accent-lt)", padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              {q.section}
            </span>
            <span style={{ color: "var(--muted2)", fontSize: 11, alignSelf: "center" }}>{q.topic}</span>
          </div>
          <div style={{
            color: "var(--soft)", fontSize: "clamp(12px, 2vw, 14px)", lineHeight: 1.5,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {q.question}
          </div>
        </div>
        <span style={{ color: "var(--muted)", fontSize: 10, paddingTop: 6, flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div style={{ padding: "0 14px 12px 52px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Your answer */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, minWidth: 90, paddingTop: 5 }}>Your answer</span>
            <span style={{
              flex: 1, padding: "5px 10px", borderRadius: 6, fontSize: 14, lineHeight: 1.5,
              color: iconColor, background: `${iconColor}11`, border: `1px solid ${iconColor}33`,
              wordBreak: "break-word",
            }}>
              {q.user_answer || <em style={{ opacity: 0.5 }}>Not answered</em>}
            </span>
          </div>
          {/* Correct answer (only if wrong/skipped) */}
          {q.result !== "correct" && q.correct_answer && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, minWidth: 90, paddingTop: 5 }}>Correct</span>
              <span style={{
                flex: 1, padding: "5px 10px", borderRadius: 6, fontSize: 14, lineHeight: 1.5,
                color: "#22c55e", background: "#22c55e11", border: "1px solid #22c55e33",
                wordBreak: "break-word",
              }}>
                {q.correct_answer}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function accColor(acc) {
  if (acc >= 70) return "var(--green)"
  if (acc >= 40) return "var(--amber)"
  return "var(--red)"
}