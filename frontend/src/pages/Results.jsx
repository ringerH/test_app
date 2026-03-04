import { useState } from "react"

export default function Results({ result, onHome }) {
  if (!result) return null

  const {
    total_correct, total_wrong, total_skipped,
    total_questions, accuracy, section_stats, topic_stats, per_question
  } = result

  const [activeTab, setActiveTab] = useState("summary")   // "summary" | "responses"
  const [filterSection, setFilterSection] = useState("All")
  const [filterResult, setFilterResult]   = useState("All")

  // Sort topics weakest first
  const topics = Object.entries(topic_stats)
    .map(([topic, stats]) => ({ topic, ...stats }))
    .sort((a, b) => a.accuracy - b.accuracy)

  // Sections list for filter
  const sections = ["All", ...Object.keys(section_stats)]

  // Filtered response sheet
  const filteredQs = (per_question || []).filter(q => {
    if (filterSection !== "All" && q.section !== filterSection) return false
    if (filterResult  !== "All" && q.result  !== filterResult)  return false
    return true
  })

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Test Complete</h1>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreNum}>{total_correct}</span>
            <span style={styles.scoreTotal}>/{total_questions}</span>
          </div>
          <div style={styles.accuracyBadge}>{accuracy}% accuracy</div>
        </div>

        {/* Summary boxes */}
        <div style={styles.summaryRow}>
          <StatBox label="Correct" value={total_correct} color="#22c55e" />
          <StatBox label="Wrong"   value={total_wrong}   color="#f87171" />
          <StatBox label="Skipped" value={total_skipped} color="#64748b" />
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["summary", "responses"].map(tab => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "summary" ? "📊 Summary" : "📋 Response Sheet"}
            </button>
          ))}
        </div>

        {/* ── SUMMARY TAB ── */}
        {activeTab === "summary" && (
          <>
            <h2 style={styles.sectionHead}>Section Breakdown</h2>
            <div style={styles.sectionGrid}>
              {Object.entries(section_stats).map(([section, stats]) => (
                <div key={section} style={styles.sectionCard}>
                  <div style={styles.sectionName}>{section}</div>
                  <div style={styles.sectionAccuracy}>{stats.accuracy}%</div>
                  <div style={styles.bar}>
                    <div style={{ ...styles.barFill, width: `${stats.accuracy}%`, background: accuracyColor(stats.accuracy) }} />
                  </div>
                  <div style={styles.sectionDetail}>
                    <span style={{ color: "#22c55e" }}>{stats.correct} correct</span>
                    <span style={{ color: "#f87171" }}>{stats.wrong} wrong</span>
                    <span style={{ color: "#64748b" }}>{stats.skipped} skipped</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={styles.sectionHead}>
              Topic Analysis <span style={styles.subHead}>(weakest first)</span>
            </h2>
            <div style={styles.topicList}>
              {topics.map(({ topic, accuracy: acc, correct, total }) => (
                <div key={topic} style={styles.topicRow}>
                  <span style={styles.topicName}>{topic}</span>
                  <div style={styles.topicBar}>
                    <div style={{ ...styles.topicBarFill, width: `${acc}%`, background: accuracyColor(acc) }} />
                  </div>
                  <span style={{ ...styles.topicAcc, color: accuracyColor(acc) }}>{acc}%</span>
                  <span style={styles.topicCount}>{correct}/{total}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── RESPONSE SHEET TAB ── */}
        {activeTab === "responses" && (
          <>
            {/* Filters */}
            <div style={styles.filters}>
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Section</span>
                <div style={styles.filterBtns}>
                  {sections.map(s => (
                    <button
                      key={s}
                      style={{ ...styles.filterBtn, ...(filterSection === s ? styles.filterBtnActive : {}) }}
                      onClick={() => setFilterSection(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Result</span>
                <div style={styles.filterBtns}>
                  {["All", "correct", "wrong", "skipped"].map(r => (
                    <button
                      key={r}
                      style={{
                        ...styles.filterBtn,
                        ...(filterResult === r ? styles.filterBtnActive : {}),
                        ...(r === "correct" ? { borderColor: "#22c55e33" } : {}),
                        ...(r === "wrong"   ? { borderColor: "#f8717133" } : {}),
                        ...(r === "skipped" ? { borderColor: "#64748b33" } : {}),
                      }}
                      onClick={() => setFilterResult(r)}
                    >
                      {r === "correct" ? "✓ Correct" : r === "wrong" ? "✗ Wrong" : r === "skipped" ? "— Skipped" : "All"}
                    </button>
                  ))}
                </div>
              </div>
              <span style={styles.filterCount}>
                Showing {filteredQs.length} of {per_question?.length || 0} questions
              </span>
            </div>

            {/* Response cards */}
            <div style={styles.responseList}>
              {filteredQs.map((q, idx) => (
                <ResponseCard key={q.q_id} q={q} idx={idx} />
              ))}
              {filteredQs.length === 0 && (
                <div style={styles.empty}>No questions match the selected filters.</div>
              )}
            </div>
          </>
        )}

        <button style={styles.homeBtn} onClick={onHome}>← Back to Home</button>
      </div>
    </div>
  )
}

// ── Single response card ──────────────────────────────────────────────────────
function ResponseCard({ q, idx }) {
  const [expanded, setExpanded] = useState(false)

  const borderColor = q.result === "correct" ? "#22c55e44"
    : q.result === "wrong"   ? "#f8717144"
    : "#64748b33"

  const bgColor = q.result === "correct" ? "#22c55e08"
    : q.result === "wrong"   ? "#f8717108"
    : "#64748b08"

  const icon = q.result === "correct" ? "✓" : q.result === "wrong" ? "✗" : "—"
  const iconColor = q.result === "correct" ? "#22c55e" : q.result === "wrong" ? "#f87171" : "#64748b"

  return (
    <div style={{ ...styles.responseCard, border: `1px solid ${borderColor}`, background: bgColor }}>

      {/* Collapsed row */}
      <div style={styles.responseRow} onClick={() => setExpanded(e => !e)}>
        <span style={{ ...styles.resultIcon, color: iconColor, borderColor: `${iconColor}44`, background: `${iconColor}11` }}>
          {icon}
        </span>
        <div style={styles.responseMain}>
          <div style={styles.responseMeta}>
            <span style={styles.responseSection}>{q.section}</span>
            <span style={styles.responseTopic}>{q.topic}</span>
          </div>
          <div style={styles.responseQ}>
            {q.question || `Question ${idx + 1}`}
          </div>
        </div>
        <span style={styles.expandIcon}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded: show answers */}
      {expanded && (
        <div style={styles.answerArea}>
          <div style={styles.answerRow}>
            <span style={styles.answerLabel}>Your answer</span>
            <span style={{
              ...styles.answerValue,
              color: q.result === "correct" ? "#22c55e" : q.result === "wrong" ? "#f87171" : "#64748b",
              background: q.result === "correct" ? "#22c55e11" : q.result === "wrong" ? "#f8717111" : "#64748b11",
              border: `1px solid ${q.result === "correct" ? "#22c55e33" : q.result === "wrong" ? "#f8717133" : "#64748b33"}`,
            }}>
              {q.user_answer || <em style={{ opacity: 0.5 }}>Not answered</em>}
            </span>
          </div>
          {q.result !== "correct" && q.correct_answer && (
            <div style={styles.answerRow}>
              <span style={styles.answerLabel}>Correct answer</span>
              <span style={{ ...styles.answerValue, color: "#22c55e", background: "#22c55e11", border: "1px solid #22c55e33" }}>
                {q.correct_answer}
              </span>
            </div>
          )}
          {q.result === "correct" && (
            <div style={{ color: "#22c55e", fontSize: "13px", marginTop: "4px" }}>
              ✓ Correct!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatBox({ label, value, color }) {
  return (
    <div style={styles.statBox}>
      <span style={{ ...styles.statNum, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function accuracyColor(acc) {
  if (acc >= 70) return "#22c55e"
  if (acc >= 40) return "#f59e0b"
  return "#f87171"
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh", background: "#0f1117",
    fontFamily: "'Segoe UI', sans-serif", padding: "32px 24px",
  },
  container: { maxWidth: "860px", margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "28px" },
  title: { color: "#f1f5f9", fontSize: "24px", fontWeight: 700, margin: "0 0 20px" },
  scoreCircle: {
    display: "inline-flex", alignItems: "baseline", gap: "4px",
    background: "#1a1d27", border: "4px solid #2563eb",
    borderRadius: "50%", width: "120px", height: "120px",
    justifyContent: "center", marginBottom: "12px",
  },
  scoreNum:   { color: "#f1f5f9", fontSize: "42px", fontWeight: 800 },
  scoreTotal: { color: "#64748b", fontSize: "20px" },
  accuracyBadge: {
    display: "inline-block", background: "#1e3a5f",
    color: "#60a5fa", padding: "4px 16px",
    borderRadius: "20px", fontSize: "14px", fontWeight: 600,
  },
  summaryRow: { display: "flex", gap: "16px", marginBottom: "28px" },
  statBox: {
    flex: 1, background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "12px", padding: "20px", textAlign: "center",
  },
  statNum:   { display: "block", fontSize: "32px", fontWeight: 800, marginBottom: "4px" },
  statLabel: { color: "#64748b", fontSize: "13px", fontWeight: 500 },

  // Tabs
  tabs: { display: "flex", gap: "8px", marginBottom: "24px" },
  tab: {
    padding: "10px 20px", background: "#1a1d27",
    border: "1px solid #2a2d3e", borderRadius: "8px",
    color: "#64748b", fontSize: "14px", fontWeight: 600, cursor: "pointer",
  },
  tabActive: {
    background: "#1e3a5f", border: "1px solid #3b82f6", color: "#60a5fa",
  },

  // Summary
  sectionHead: { color: "#f1f5f9", fontSize: "16px", fontWeight: 700, margin: "0 0 14px" },
  subHead: { color: "#64748b", fontWeight: 400, fontSize: "13px" },
  sectionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" },
  sectionCard: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "12px", padding: "16px",
  },
  sectionName:     { color: "#94a3b8", fontSize: "13px", marginBottom: "6px" },
  sectionAccuracy: { color: "#f1f5f9", fontSize: "22px", fontWeight: 800, marginBottom: "8px" },
  bar: { height: "6px", background: "#2a2d3e", borderRadius: "3px", marginBottom: "10px" },
  barFill: { height: "100%", borderRadius: "3px" },
  sectionDetail: { display: "flex", gap: "10px", fontSize: "12px" },
  topicList: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" },
  topicRow: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "10px", padding: "12px 16px",
  },
  topicName:    { color: "#cbd5e1", fontSize: "14px", minWidth: "180px" },
  topicBar:     { flex: 1, height: "6px", background: "#2a2d3e", borderRadius: "3px" },
  topicBarFill: { height: "100%", borderRadius: "3px" },
  topicAcc:     { fontSize: "14px", fontWeight: 700, minWidth: "42px", textAlign: "right" },
  topicCount:   { color: "#64748b", fontSize: "13px", minWidth: "40px", textAlign: "right" },

  // Filters
  filters: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "12px", padding: "16px 20px",
    marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px",
  },
  filterGroup: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  filterLabel: { color: "#64748b", fontSize: "12px", fontWeight: 600, minWidth: "60px", textTransform: "uppercase" },
  filterBtns: { display: "flex", gap: "6px", flexWrap: "wrap" },
  filterBtn: {
    padding: "4px 12px", background: "#0f1117",
    border: "1px solid #2a2d3e", borderRadius: "6px",
    color: "#64748b", fontSize: "12px", fontWeight: 500, cursor: "pointer",
  },
  filterBtnActive: { background: "#1e3a5f", border: "1px solid #3b82f6", color: "#60a5fa" },
  filterCount: { color: "#475569", fontSize: "12px", marginTop: "4px" },

  // Response sheet
  responseList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" },
  responseCard: { borderRadius: "10px", overflow: "hidden" },
  responseRow: {
    display: "flex", alignItems: "flex-start", gap: "12px",
    padding: "14px 16px", cursor: "pointer",
  },
  resultIcon: {
    width: "28px", height: "28px", borderRadius: "50%",
    border: "2px solid", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "13px", fontWeight: 800,
    flexShrink: 0, marginTop: "2px",
  },
  responseMain: { flex: 1, minWidth: 0 },
  responseMeta: { display: "flex", gap: "8px", marginBottom: "4px", flexWrap: "wrap" },
  responseSection: {
    background: "#1e3a5f", color: "#60a5fa",
    padding: "1px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
  },
  responseTopic: { color: "#475569", fontSize: "11px", alignSelf: "center" },
  responseQ: {
    color: "#cbd5e1", fontSize: "14px", lineHeight: 1.5,
    overflow: "hidden", textOverflow: "ellipsis",
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
  },
  expandIcon: { color: "#475569", fontSize: "10px", flexShrink: 0, paddingTop: "6px" },

  answerArea: { padding: "0 16px 14px 56px", display: "flex", flexDirection: "column", gap: "8px" },
  answerRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  answerLabel: { color: "#64748b", fontSize: "12px", fontWeight: 600, minWidth: "100px", paddingTop: "6px" },
  answerValue: {
    flex: 1, padding: "6px 12px", borderRadius: "6px",
    fontSize: "14px", lineHeight: 1.5,
  },

  homeBtn: {
    padding: "12px 28px", background: "#1a1d27",
    color: "#60a5fa", border: "1px solid #3b82f6",
    borderRadius: "10px", fontSize: "15px",
    fontWeight: 600, cursor: "pointer",
  },
  empty: { color: "#475569", textAlign: "center", padding: "40px", fontSize: "14px" },
}