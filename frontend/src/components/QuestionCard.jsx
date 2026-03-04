import { useEffect, useRef } from "react"

// ─── Text → LaTeX normalizer ──────────────────────────────────────────────────
function prepareText(raw) {
  if (!raw) return ""
  let t = raw
  // Protect currency dollar signs (e.g. $12, $100)
  t = t.replace(/\$(\s*\d)/g, "CURRENCY$1")
  // Normalize fraction variants
  t = t.replace(/\\[td]frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
  // Unicode fraction characters → LaTeX
  const fracs = { "½":"\\frac{1}{2}", "⅓":"\\frac{1}{3}", "⅔":"\\frac{2}{3}",
                  "¼":"\\frac{1}{4}", "¾":"\\frac{3}{4}", "⅕":"\\frac{1}{5}",
                  "⅖":"\\frac{2}{5}", "⅗":"\\frac{3}{5}", "⅘":"\\frac{4}{5}",
                  "⅙":"\\frac{1}{6}", "⅚":"\\frac{5}{6}", "⅛":"\\frac{1}{8}",
                  "⅜":"\\frac{3}{8}", "⅝":"\\frac{5}{8}", "⅞":"\\frac{7}{8}" }
  for (const [ch, latex] of Object.entries(fracs))
    t = t.replaceAll(ch, `$${latex}$`)
  // Greek / math symbols
  t = t.replace(/[𝛌λ]/g, "$\\lambda$")
  t = t.replace(/[𝜋π]/g, "$\\pi$")
  t = t.replace(/[𝛼α]/g, "$\\alpha$")
  t = t.replace(/[𝛽β]/g, "$\\beta$")
  t = t.replace(/√(\d+)/g, "$\\sqrt{$1}$")
  // Restore currency
  t = t.replace(/CURRENCY/g, "Rs.\u00A0")
  return t.replace(/\s+/g, " ").trim()
}

// ─── Renders text with inline KaTeX math ─────────────────────────────────────
function MathText({ text, block }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !window.katex) return
    const cleaned = prepareText(text || "")

    // Split on $...$ and $$...$$
    const parts = []
    const re = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g
    let last = 0, m
    while ((m = re.exec(cleaned)) !== null) {
      if (m.index > last) parts.push({ k: "txt", v: cleaned.slice(last, m.index) })
      parts.push(m[1] !== undefined
        ? { k: "blk", v: m[1] }
        : { k: "inl", v: m[2] })
      last = m.index + m[0].length
    }
    if (last < cleaned.length) parts.push({ k: "txt", v: cleaned.slice(last) })

    if (parts.every(p => p.k === "txt")) { el.textContent = cleaned; return }

    let html = ""
    for (const p of parts) {
      if (p.k === "txt") {
        html += p.v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      } else {
        try {
          html += window.katex.renderToString(p.v, {
            displayMode: p.k === "blk",
            throwOnError: false,
            output: "html",
          })
        } catch { html += p.v }
      }
    }
    el.innerHTML = html
  }, [text])

  return <span ref={ref} className={block ? "math-block" : "math-inline"}>{text}</span>
}

// ─── Coding question parser ───────────────────────────────────────────────────
function parseCoding(raw) {
  const lines = raw.replace(/\\n/g, "\n").split("\n").map(l => l.trim()).filter(Boolean)
  const out = { desc: [], examples: [], constraints: [], inputFormat: [], code: {} }
  let mode = "desc", curEx = null, curLang = null, curCode = []

  const CODE_LANGS = { "c++": "cpp", cpp: "cpp", python: "python", java: "java" }
  const isLangLine = l => Object.keys(CODE_LANGS).some(k => l.toLowerCase().startsWith(k))
  const getLang    = l => CODE_LANGS[Object.keys(CODE_LANGS).find(k => l.toLowerCase().startsWith(k))]

  for (const line of lines) {
    if (/^example\s*\d+/i.test(line)) {
      if (curEx) out.examples.push(curEx)
      curEx = { label: line, inputs: [], outputs: [], explanation: [] }
      mode = "example"; continue
    }
    if (/^constraint/i.test(line)) {
      if (curEx) { out.examples.push(curEx); curEx = null }
      mode = "constraints"; continue
    }
    if (/^(input format|the input format)/i.test(line)) { mode = "inputFmt"; continue }
    if (isLangLine(line) && mode !== "desc") {
      if (curCode.length && curLang) out.code[curLang] = curCode.join("\n")
      curCode = []; curLang = getLang(line); mode = "code"; continue
    }

    if      (mode === "desc")        out.desc.push(line)
    else if (mode === "example" && curEx) {
      if      (/^input:/i.test(line))       curEx.inputs.push(line.replace(/^input:\s*/i, ""))
      else if (/^output:/i.test(line))      curEx.outputs.push(line.replace(/^output:\s*/i, ""))
      else if (/^explanation:/i.test(line)) mode = "expl"
      else if (mode === "expl")             curEx.explanation.push(line)
      else if (curEx.outputs.length)        curEx.explanation.push(line)
      else                                  curEx.inputs.push(line)
    }
    else if (mode === "constraints") out.constraints.push(line)
    else if (mode === "inputFmt")    out.inputFormat.push(line)
    else if (mode === "code")        curCode.push(line)
  }
  if (curEx) out.examples.push(curEx)
  if (curCode.length && curLang) out.code[curLang] = curCode.join("\n")
  return out
}

function CodingCard({ question, index, total }) {
  const p = parseCoding(question.question)
  return (
    <div className="qcard coding-card">
      <div className="coding-head">
        <span className="coding-tag">Coding</span>
        <span className="qnum">Problem {index + 1} of {total}</span>
      </div>

      <div className="coding-body">
        {/* Description */}
        <div className="coding-desc">
          {p.desc.map((line, i) => <p key={i} className="desc-line">{line}</p>)}
        </div>

        {/* Examples */}
        {p.examples.map((ex, i) => (
          <div key={i} className="example-block">
            <div className="ex-label">{ex.label || `Example ${i + 1}`}</div>
            <div className="io-grid">
              <div className="io-box">
                <div className="io-head">Input</div>
                <pre className="io-pre">{ex.inputs.join("\n")}</pre>
              </div>
              <div className="io-box">
                <div className="io-head">Output</div>
                <pre className="io-pre output-pre">{ex.outputs.join("\n")}</pre>
              </div>
            </div>
            {ex.explanation.length > 0 && (
              <p className="expl-text">
                <span className="expl-label">Explanation: </span>
                {ex.explanation.join(" ")}
              </p>
            )}
          </div>
        ))}

        {/* Constraints */}
        {p.constraints.length > 0 && (
          <div className="coding-sub-section">
            <div className="sub-title">Constraints</div>
            {p.constraints.map((c, i) => (
              <div key={i} className="constraint-row">
                <span className="bullet">▸</span>
                <MathText text={c} />
              </div>
            ))}
          </div>
        )}

        {/* Input format */}
        {p.inputFormat.length > 0 && (
          <div className="coding-sub-section">
            <div className="sub-title">Input Format</div>
            {p.inputFormat.map((l, i) => (
              <div key={i} className="constraint-row">
                <span className="bullet">▸</span>{l}
              </div>
            ))}
          </div>
        )}

        {/* Starter code */}
        {Object.keys(p.code).length > 0 && (
          <div className="coding-sub-section">
            <div className="sub-title">Starter Code</div>
            {Object.entries(p.code).map(([lang, code]) => (
              <div key={lang} className="code-block">
                <div className="code-lang-label">{lang.toUpperCase()}</div>
                <pre className="code-pre">{code}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MCQ card ─────────────────────────────────────────────────────────────────
export default function QuestionCard({ question, index, total, selected, onSelect, section }) {
  const isCoding = section === "Advanced Coding" || !question.options?.length
  if (isCoding) return <CodingCard question={question} index={index} total={total} />

  return (
    <div className="qcard mcq-card">
      <div className="qnum">Question {index + 1} of {total}</div>

      <div className="qtext">
        <MathText text={question.question} block />
      </div>

      <div className="options">
        {question.options.map((opt, i) => {
          const isSel = selected === opt
          return (
            <button
              key={i}
              className={`option ${isSel ? "option--on" : ""}`}
              onClick={() => onSelect(question.q_id, opt)}
            >
              <span className={`opt-badge ${isSel ? "opt-badge--on" : ""}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="opt-text">
                <MathText text={opt} />
              </span>
            </button>
          )
        })}
      </div>

      <style>{`
        /* ── Shared card wrapper ── */
        .qcard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: clamp(16px, 4vw, 32px);
          width: 100%;
          min-width: 0;
        }

        /* ── Math helpers ── */
        .math-block  { display: block; }
        .math-inline { display: inline; }

        /* ── MCQ ── */
        .mcq-card {}
        .qnum  { color: var(--muted); font-size: 13px; font-weight: 500; margin-bottom: 12px; }
        .qtext {
          color: var(--text);
          font-size: clamp(14px, 2.5vw, 17px);
          line-height: 1.8;
          margin-bottom: 24px;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .options { display: flex; flex-direction: column; gap: 8px; }
        .option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: clamp(10px, 2vw, 14px) clamp(10px, 2vw, 16px);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          text-align: left;
          width: 100%;
          transition: border-color 0.15s, background 0.15s;
        }
        .option:hover { border-color: #3b82f655; }
        .option--on   { background: #1e3a5f; border-color: var(--accent); }
        .opt-badge {
          flex-shrink: 0;
          width: 26px; height: 26px;
          background: var(--border);
          color: var(--subtle);
          border-radius: 6px;
          font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .opt-badge--on { background: var(--accent); color: #fff; }
        .opt-text {
          color: var(--soft);
          font-size: clamp(13px, 2vw, 15px);
          line-height: 1.65;
          word-break: break-word;
          overflow-wrap: break-word;
          min-width: 0;
          flex: 1;
        }

        /* ── Coding card ── */
        .coding-card {}
        .coding-head { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .coding-tag {
          background: var(--purple-bg); color: var(--purple);
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          padding: 3px 10px; border-radius: 5px;
        }
        .coding-body { display: flex; flex-direction: column; gap: 20px; }
        .coding-desc {}
        .desc-line { color: var(--soft); font-size: clamp(13px, 2vw, 15px); line-height: 1.75; margin-bottom: 6px; }

        .example-block {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: clamp(10px, 2vw, 16px);
        }
        .ex-label { color: var(--amber); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
        .io-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 480px) { .io-grid { grid-template-columns: 1fr; } }
        .io-head { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
        .io-pre {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 10px 12px;
          color: #34d399;
          font-size: clamp(11px, 1.8vw, 13px);
          font-family: 'Consolas', 'Courier New', monospace;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-x: auto;
        }
        .output-pre { color: #7dd3fc; }
        .expl-text { color: var(--subtle); font-size: 13px; line-height: 1.65; margin-top: 10px; }
        .expl-label { color: var(--amber); font-weight: 600; }

        .coding-sub-section {}
        .sub-title {
          color: var(--accent-lt); font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px;
          padding-bottom: 6px; margin-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .constraint-row { display: flex; align-items: flex-start; gap: 8px; color: var(--soft); font-size: 14px; line-height: 1.65; margin-bottom: 5px; }
        .bullet { color: var(--accent); font-size: 10px; margin-top: 5px; flex-shrink: 0; }
        .code-block { margin-bottom: 10px; }
        .code-lang-label {
          display: inline-block;
          background: var(--border); color: var(--subtle);
          font-size: 11px; font-weight: 700;
          padding: 2px 10px; border-radius: 5px 5px 0 0;
        }
        .code-pre {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 0 6px 6px 6px;
          padding: clamp(10px, 2vw, 16px);
          color: #7dd3fc;
          font-size: clamp(11px, 1.8vw, 13px);
          font-family: 'Consolas', 'Courier New', monospace;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
          overflow-x: auto;
        }
      `}</style>
    </div>
  )
}