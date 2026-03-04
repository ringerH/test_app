export default function SectionNav({ sections, activeSectionIdx, activeQIdx, answers, onJump }) {
  return (
    <div style={styles.nav}>
      {sections.map((section, si) => {
        const isActiveSection = si === activeSectionIdx
        return (
          <div key={si} style={styles.section}>
            <div style={{ ...styles.sectionTitle, ...(isActiveSection ? styles.sectionTitleActive : {}) }}>
              {section.section}
              <span style={styles.sectionMeta}>{section.questions.length}Q · {section.time_mins}m</span>
            </div>

            {/* Question dots */}
            <div style={styles.dots}>
              {section.questions.map((q, qi) => {
                const answered = !!answers[q.q_id]
                const isCurrent = si === activeSectionIdx && qi === activeQIdx
                return (
                  <button
                    key={qi}
                    style={{
                      ...styles.dot,
                      ...(isCurrent  ? styles.dotCurrent  : {}),
                      ...(answered && !isCurrent ? styles.dotAnswered : {}),
                    }}
                    onClick={() => onJump(si, qi)}
                    title={`Q${qi + 1}`}
                  >
                    {qi + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  nav: {
    width: "220px",
    minWidth: "220px",
    background: "#1a1d27",
    border: "1px solid #2a2d3e",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    overflowY: "auto",
    maxHeight: "calc(100vh - 120px)",
  },
  section: {},
  sectionTitle: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  sectionTitleActive: { color: "#60a5fa" },
  sectionMeta: { color: "#475569", fontWeight: 400, fontSize: "10px", textTransform: "none", letterSpacing: 0 },
  dots: { display: "flex", flexWrap: "wrap", gap: "6px" },
  dot: {
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    background: "#0f1117",
    border: "1px solid #2a2d3e",
    color: "#64748b",
    fontSize: "11px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
  },
  dotAnswered: { background: "#1e3a5f", border: "1px solid #3b82f6", color: "#60a5fa" },
  dotCurrent:  { background: "#2563eb", border: "1px solid #2563eb", color: "#fff" },
}