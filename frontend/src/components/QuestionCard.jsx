import { useEffect, useRef } from "react"

// ── Text cleaner ──────────────────────────────────────────────────────────────
function cleanText(text) {
  if (!text) return ""
  let t = text.replace(/\$(\s*\d)/g, "DOLLARSIGN$1")
  t = t.replace(/\\tfrac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
  t = t.replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
  t = t.replace(/𝛌/g, "\\lambda")
  t = t.replace(/𝜋/g, "\\pi")
  t = t.replace(/⅓/g, "$\\frac{1}{3}$")
  t = t.replace(/⅔/g, "$\\frac{2}{3}$")
  t = t.replace(/¼/g, "$\\frac{1}{4}$")
  t = t.replace(/¾/g, "$\\frac{3}{4}$")
  t = t.replace(/½/g, "$\\frac{1}{2}$")
  t = t.replace(/⅕/g, "$\\frac{1}{5}$")
  t = t.replace(/⅙/g, "$\\frac{1}{6}$")
  t = t.replace(/⅛/g, "$\\frac{1}{8}$")
  t = t.replace(/DOLLARSIGN/g, "Rs.\u00A0")
  t = t.replace(/\s+/g, " ").trim()
  return t
}

// ── Math renderer for normal questions ───────────────────────────────────────
function MathRenderer({ text, block = false }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !window.katex) return
    const el = ref.current
    const cleaned = cleanText(text)
    const parts = []
    const regex = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g
    let lastIdx = 0, match
    while ((match = regex.exec(cleaned)) !== null) {
      if (match.index > lastIdx) parts.push({ type: "text", content: cleaned.slice(lastIdx, match.index) })
      if (match[1] !== undefined) parts.push({ type: "block-math", content: match[1] })
      else parts.push({ type: "inline-math", content: match[2] })
      lastIdx = match.index + match[0].length
    }
    if (lastIdx < cleaned.length) parts.push({ type: "text", content: cleaned.slice(lastIdx) })
    if (parts.every(p => p.type === "text")) { el.textContent = cleaned; return }
    let html = ""
    for (const part of parts) {
      if (part.type === "text") {
        html += part.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      } else {
        try {
          html += window.katex.renderToString(part.content, {
            displayMode: part.type === "block-math", throwOnError: false, output: "html",
          })
        } catch { html += part.content }
      }
    }
    el.innerHTML = html
  }, [text])
  return <span ref={ref} style={block ? { display: "block" } : {}}>{text}</span>
}

// ── Coding question parser ────────────────────────────────────────────────────
function parseCodingQuestion(raw) {
  const lines = raw.split(/\n|\\n/).map(l => l.trim()).filter(Boolean)

  const result = {
    description: [],
    examples: [],     // [{ input, output, explanation }]
    constraints: [],
    inputFormat: [],
    code: {},         // { cpp, python, java, ... }
  }

  let section = "description"
  let currentExample = null
  let codeLang = null
  let codeLines = []

  const CODE_LANGS = { "c++": "cpp", "cpp": "cpp", "python": "python", "java": "java", "javascript": "javascript" }
  const isCodeLangLine = (l) => Object.keys(CODE_LANGS).some(k => l.toLowerCase().startsWith(k))

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const low = line.toLowerCase()

    // Detect section transitions
    if (/^example\s*\d+/i.test(line)) {
      if (currentExample) result.examples.push(currentExample)
      currentExample = { label: line, input: [], output: [], explanation: [] }
      section = "example"
      continue
    }
    if (/^constraint/i.test(line)) {
      if (currentExample) { result.examples.push(currentExample); currentExample = null }
      section = "constraints"
      continue
    }
    if (/^input format|^the input format/i.test(line)) {
      section = "inputFormat"
      continue
    }
    if (isCodeLangLine(line) && section !== "description") {
      codeLines = []
      codeLang = CODE_LANGS[Object.keys(CODE_LANGS).find(k => low.startsWith(k))]
      section = "code"
      continue
    }

    // Within sections
    if (section === "description") {
      result.description.push(line)
    } else if (section === "example" && currentExample) {
      if (/^input:/i.test(line)) { currentExample.input.push(line.replace(/^input:\s*/i, "")); continue }
      if (/^output:/i.test(line)) { currentExample.output.push(line.replace(/^output:\s*/i, "")); continue }
      if (/^explanation:/i.test(line)) { section = "explanation"; continue }
      if (section === "explanation") currentExample.explanation.push(line)
      else if (currentExample.output.length) currentExample.explanation.push(line)
      else currentExample.input.push(line)
    } else if (section === "constraints") {
      result.constraints.push(line)
    } else if (section === "inputFormat") {
      result.inputFormat.push(line)
    } else if (section === "code") {
      // Accumulate code until next lang header or end
      if (isCodeLangLine(line) && line !== lines[i]) {
        if (codeLines.length) result.code[codeLang] = codeLines.join("\n")
        codeLines = []
        codeLang = CODE_LANGS[Object.keys(CODE_LANGS).find(k => line.toLowerCase().startsWith(k))]
      } else {
        codeLines.push(line)
      }
    }
  }

  if (currentExample) result.examples.push(currentExample)
  if (codeLines.length && codeLang) result.code[codeLang] = codeLines.join("\n")

  return result
}

// ── Coding question renderer ──────────────────────────────────────────────────
function CodingQuestionCard({ question, index, total }) {
  const parsed = parseCodingQuestion(question.question)
  const langs = Object.keys(parsed.code)

  return (
    <div style={cStyles.card}>
      <div style={cStyles.header}>
        <span style={cStyles.tag}>Coding</span>
        <span style={cStyles.qNum}>Problem {index + 1} of {total}</span>
      </div>

      {/* Problem statement */}
      <div style={cStyles.section}>
        {parsed.description.map((line, i) => (
          <p key={i} style={cStyles.para}>{line}</p>
        ))}
      </div>

      {/* Examples */}
      {parsed.examples.map((ex, i) => (
        <div key={i} style={cStyles.exampleBlock}>
          <div style={cStyles.exampleLabel}>{ex.label || `Example ${i + 1}`}</div>
          <div style={cStyles.ioGrid}>
            <div style={cStyles.ioBox}>
              <div style={cStyles.ioLabel}>Input</div>
              <pre style={cStyles.pre}>{ex.input.join("\n")}</pre>
            </div>
            <div style={cStyles.ioBox}>
              <div style={cStyles.ioLabel}>Output</div>
              <pre style={cStyles.pre}>{ex.output.join("\n")}</pre>
            </div>
          </div>
          {ex.explanation.length > 0 && (
            <div style={cStyles.explanation}>
              <span style={cStyles.explLabel}>Explanation: </span>
              {ex.explanation.join(" ")}
            </div>
          )}
        </div>
      ))}

      {/* Constraints */}
      {parsed.constraints.length > 0 && (
        <div style={cStyles.section}>
          <div style={cStyles.sectionTitle}>Constraints</div>
          {parsed.constraints.map((c, i) => (
            <div key={i} style={cStyles.constraint}>
              <span style={cStyles.bullet}>▸</span>
              <MathRenderer text={c} />
            </div>
          ))}
        </div>
      )}

      {/* Input format */}
      {parsed.inputFormat.length > 0 && (
        <div style={cStyles.section}>
          <div style={cStyles.sectionTitle}>Input Format</div>
          {parsed.inputFormat.map((l, i) => (
            <div key={i} style={cStyles.constraint}>
              <span style={cStyles.bullet}>▸</span>{l}
            </div>
          ))}
        </div>
      )}

      {/* Starter code */}
      {langs.length > 0 && (
        <div style={cStyles.section}>
          <div style={cStyles.sectionTitle}>Starter Code</div>
          {langs.map(lang => (
            <div key={lang} style={cStyles.codeBlock}>
              <div style={cStyles.codeLang}>{lang.toUpperCase()}</div>
              <pre style={cStyles.codeText}>{parsed.code[lang]}</pre>
            </div>
          ))}
        </div>
      )}

      <div style={cStyles.note}>
        ℹ️ Write your solution in the actual TCS exam interface. This is for problem understanding only.
      </div>
    </div>
  )
}

const cStyles = {
  card: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "14px", padding: "28px", flex: 1,
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  tag: {
    background: "#2d1f3d", color: "#a78bfa",
    padding: "3px 10px", borderRadius: "5px",
    fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
  },
  qNum: { color: "#64748b", fontSize: "13px", fontWeight: 500 },
  section: { marginBottom: "20px" },
  sectionTitle: {
    color: "#60a5fa", fontSize: "13px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
    marginBottom: "10px", paddingBottom: "6px",
    borderBottom: "1px solid #2a2d3e",
  },
  para: { color: "#cbd5e1", fontSize: "15px", lineHeight: 1.75, margin: "0 0 10px" },
  exampleBlock: {
    background: "#0f1117", border: "1px solid #2a2d3e",
    borderRadius: "10px", padding: "16px", marginBottom: "14px",
  },
  exampleLabel: {
    color: "#f59e0b", fontSize: "12px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px",
  },
  ioGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  ioBox: {},
  ioLabel: {
    color: "#64748b", fontSize: "11px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px",
  },
  pre: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "6px", padding: "10px 14px",
    color: "#34d399", fontSize: "13px", fontFamily: "'Consolas', 'Courier New', monospace",
    margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
  },
  explanation: {
    marginTop: "12px", color: "#94a3b8", fontSize: "13px", lineHeight: 1.65,
  },
  explLabel: { color: "#f59e0b", fontWeight: 600 },
  constraint: {
    display: "flex", alignItems: "flex-start", gap: "8px",
    color: "#cbd5e1", fontSize: "14px", marginBottom: "6px", lineHeight: 1.6,
  },
  bullet: { color: "#3b82f6", fontSize: "10px", marginTop: "4px", flexShrink: 0 },
  codeBlock: { marginBottom: "14px" },
  codeLang: {
    background: "#2a2d3e", color: "#94a3b8",
    fontSize: "11px", fontWeight: 700, padding: "4px 12px",
    borderRadius: "6px 6px 0 0", display: "inline-block",
  },
  codeText: {
    background: "#0f1117", border: "1px solid #2a2d3e",
    borderRadius: "0 6px 6px 6px", padding: "16px",
    color: "#7dd3fc", fontSize: "13px",
    fontFamily: "'Consolas', 'Courier New', monospace",
    margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
    lineHeight: 1.6,
  },
  note: {
    background: "#1e3a5f22", border: "1px solid #3b82f633",
    borderRadius: "8px", padding: "10px 14px",
    color: "#64748b", fontSize: "12px", marginTop: "8px",
  },
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function QuestionCard({ question, index, total, selected, onSelect, section }) {
  const isCoding = section === "Advanced Coding" || question.options?.length === 0

  if (isCoding) {
    return <CodingQuestionCard question={question} index={index} total={total} />
  }

  return (
    <div style={styles.card}>
      <div style={styles.qNum}>Question {index + 1} of {total}</div>
      <p style={styles.qText}>
        <MathRenderer text={question.question} block />
      </p>
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
              <span style={styles.optText}>
                <MathRenderer text={opt} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "14px", padding: "32px", flex: 1,
  },
  qNum: { color: "#64748b", fontSize: "13px", marginBottom: "12px", fontWeight: 500 },
  qText: { color: "#f1f5f9", fontSize: "17px", lineHeight: 1.8, marginBottom: "28px", margin: "0 0 28px" },
  options: { display: "flex", flexDirection: "column", gap: "10px" },
  option: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "14px 16px", background: "#0f1117",
    border: "1px solid #2a2d3e", borderRadius: "10px",
    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
  },
  optionSelected: { background: "#1e3a5f", border: "1px solid #3b82f6" },
  optLabel: {
    minWidth: "28px", height: "28px", background: "#2a2d3e", color: "#94a3b8",
    borderRadius: "6px", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0,
  },
  optLabelSelected: { background: "#2563eb", color: "#fff" },
  optText: { color: "#cbd5e1", fontSize: "15px", lineHeight: 1.6 },
}