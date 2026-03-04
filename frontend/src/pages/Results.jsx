export default function Results({ result, onHome }) {
  if (!result) return null

  const { total_correct, total_wrong, total_skipped, total_questions, accuracy, section_stats, topic_stats } = result

  // Sort topics by accuracy ascending (weakest first)
  const topics = Object.entries(topic_stats)
    .map(([topic, stats]) => ({ topic, ...stats }))
    .sort((a, b) => a.accuracy - b.accuracy)

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

        {/* Summary row */}
        <div style={styles.summaryRow}>
          <StatBox label="Correct"  value={total_correct}  color="#22c55e" />
          <StatBox label="Wrong"    value={total_wrong}    color="#f87171" />
          <StatBox label="Skipped"  value={total_skipped}  color="#64748b" />
        </div>

        {/* Section breakdown */}
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

        {/* Weak topics */}
        <h2 style={styles.sectionHead}>Topic Analysis <span style={styles.subHead}>(weakest first)</span></h2>
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

        <button style={styles.homeBtn} onClick={onHome}>← Back to Home</button>
      </div>
    </div>
  )
}

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

const styles = {
  page: {
    minHeight: "100vh", background: "#0f1117",
    fontFamily: "'Segoe UI', sans-serif", padding: "32px 24px",
  },
  container: { maxWidth: "800px", margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "32px" },
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
  summaryRow: { display: "flex", gap: "16px", marginBottom: "32px" },
  statBox: {
    flex: 1, background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "12px", padding: "20px", textAlign: "center",
  },
  statNum:   { display: "block", fontSize: "32px", fontWeight: 800, marginBottom: "4px" },
  statLabel: { color: "#64748b", fontSize: "13px", fontWeight: 500 },
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
  barFill: { height: "100%", borderRadius: "3px", transition: "width 0.5s ease" },
  sectionDetail: { display: "flex", gap: "10px", fontSize: "12px" },
  topicList: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" },
  topicRow: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "10px", padding: "12px 16px",
  },
  topicName:     { color: "#cbd5e1", fontSize: "14px", minWidth: "180px" },
  topicBar:      { flex: 1, height: "6px", background: "#2a2d3e", borderRadius: "3px" },
  topicBarFill:  { height: "100%", borderRadius: "3px" },
  topicAcc:      { fontSize: "14px", fontWeight: 700, minWidth: "42px", textAlign: "right" },
  topicCount:    { color: "#64748b", fontSize: "13px", minWidth: "40px", textAlign: "right" },
  homeBtn: {
    padding: "12px 28px", background: "#1a1d27",
    color: "#60a5fa", border: "1px solid #3b82f6",
    borderRadius: "10px", fontSize: "15px",
    fontWeight: 600, cursor: "pointer",
  },
}