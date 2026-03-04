export default function QuestionCard({ question, index, total, selected, onSelect }) {
  return (
    <div style={styles.card}>

      {/* Question number + text */}
      <div style={styles.qNum}>Question {index + 1} of {total}</div>
      <p style={styles.qText}>{question.question}</p>

      {/* Options */}
      <div style={styles.options}>
        {question.options.map((opt, i) => {
          const isSelected = selected === opt
          return (
            <button
              key={i}
              style={{ ...styles.option, ...(isSelected ? styles.optionSelected : {}) }}
              onClick={() => onSelect(question.q_id, opt)}
            >
              <span style={{ ...styles.optLabel, ...(isSelected ? styles.optLabelSelected : {}) }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={styles.optText}>{opt}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}

const styles = {
  card: {
    background: "#1a1d27",
    border: "1px solid #2a2d3e",
    borderRadius: "14px",
    padding: "32px",
    flex: 1,
  },
  qNum: { color: "#64748b", fontSize: "13px", marginBottom: "12px", fontWeight: 500 },
  qText: { color: "#f1f5f9", fontSize: "17px", lineHeight: 1.7, marginBottom: "28px", margin: "0 0 28px" },
  options: { display: "flex", flexDirection: "column", gap: "10px" },
  option: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    background: "#0f1117",
    border: "1px solid #2a2d3e",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  },
  optionSelected: {
    background: "#1e3a5f",
    border: "1px solid #3b82f6",
  },
  optLabel: {
    minWidth: "28px",
    height: "28px",
    background: "#2a2d3e",
    color: "#94a3b8",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
  },
  optLabelSelected: { background: "#2563eb", color: "#fff" },
  optText: { color: "#cbd5e1", fontSize: "15px" },
}