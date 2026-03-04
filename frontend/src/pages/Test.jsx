import { useState, useRef } from "react"
import Timer from "../components/Timer"
import QuestionCard from "../components/QuestionCard"
import SectionNav from "../components/SectionNav"
import { submitTest } from "../api"

export default function Test({ sessionId, testData, onFinish }) {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [activeQIdx, setActiveQIdx]             = useState(0)
  const [answers, setAnswers]                   = useState({})   // { q_id: selected_option }
  const [submitting, setSubmitting]             = useState(false)
  const [error, setError]                       = useState(null)
  const sectionStartTimes                       = useRef({})     // track time per section

  const sections       = testData.sections
  const activeSection  = sections[activeSectionIdx]
  const activeQuestion = activeSection.questions[activeQIdx]
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const totalAnswered  = Object.keys(answers).length

  // Record section start time on first visit
  if (!sectionStartTimes.current[activeSection.section]) {
    sectionStartTimes.current[activeSection.section] = Date.now()
  }

  function handleSelect(q_id, option) {
    setAnswers(prev => ({ ...prev, [q_id]: option }))
  }

  function handleJump(si, qi) {
    setActiveSectionIdx(si)
    setActiveQIdx(qi)
  }

  function handlePrev() {
    if (activeQIdx > 0) {
      setActiveQIdx(q => q - 1)
    } else if (activeSectionIdx > 0) {
      const prevSection = sections[activeSectionIdx - 1]
      setActiveSectionIdx(s => s - 1)
      setActiveQIdx(prevSection.questions.length - 1)
    }
  }

  function handleNext() {
    if (activeQIdx < activeSection.questions.length - 1) {
      setActiveQIdx(q => q + 1)
    } else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx(s => s + 1)
      setActiveQIdx(0)
    }
  }

  async function handleSubmit() {
    if (!window.confirm(`Submit test? You've answered ${totalAnswered}/${totalQuestions} questions.`)) return

    // Calculate time spent per section
    const section_times = {}
    for (const [sec, startTime] of Object.entries(sectionStartTimes.current)) {
      section_times[sec] = Math.floor((Date.now() - startTime) / 1000)
    }

    setSubmitting(true)
    setError(null)
    try {
      const data = await submitTest(sessionId, answers, section_times)
      onFinish(data.result)
    } catch (e) {
      setError("Submission failed. Please try again.")
      setSubmitting(false)
    }
  }

  const isFirst = activeSectionIdx === 0 && activeQIdx === 0
  const isLast  = activeSectionIdx === sections.length - 1 &&
                  activeQIdx === activeSection.questions.length - 1

  return (
    <div style={styles.page}>

      {/* Top bar */}
      <div style={styles.topbar}>
        <span style={styles.topTitle}>TCS NQT Mock Test</span>
        <Timer totalSeconds={testData.total_time_mins * 60} onExpire={handleSubmit} />
        <div style={styles.topRight}>
          <span style={styles.progress}>{totalAnswered}/{totalQuestions} answered</span>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Left: section nav */}
        <SectionNav
          sections={sections}
          activeSectionIdx={activeSectionIdx}
          activeQIdx={activeQIdx}
          answers={answers}
          onJump={handleJump}
        />

        {/* Right: question + controls */}
        <div style={styles.main}>

          {/* Section label */}
          <div style={styles.sectionLabel}>
            <span style={styles.partTag}>{activeSection.part}</span>
            <span style={styles.sectionName}>{activeSection.section}</span>
            <span style={styles.sectionTime}>⏱ {activeSection.time_mins} mins</span>
          </div>

          {/* Question card */}
          <QuestionCard
            question={activeQuestion}
            index={activeQIdx}
            total={activeSection.questions.length}
            selected={answers[activeQuestion.q_id] || null}
            onSelect={handleSelect}
          />

          {error && <div style={styles.error}>{error}</div>}

          {/* Navigation buttons */}
          <div style={styles.navBtns}>
            <button style={styles.navBtn} onClick={handlePrev} disabled={isFirst}>← Previous</button>
            <button
              style={{ ...styles.navBtn, ...styles.clearBtn }}
              onClick={() => {
                const updated = { ...answers }
                delete updated[activeQuestion.q_id]
                setAnswers(updated)
              }}
            >
              Clear
            </button>
            <button style={{ ...styles.navBtn, ...styles.nextBtn }} onClick={handleNext} disabled={isLast}>
              Next →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: "100vh", background: "#0f1117", fontFamily: "'Segoe UI', sans-serif" },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 28px",
    background: "#1a1d27",
    borderBottom: "1px solid #2a2d3e",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  topTitle: { color: "#f1f5f9", fontWeight: 700, fontSize: "16px" },
  topRight: { display: "flex", alignItems: "center", gap: "16px" },
  progress: { color: "#64748b", fontSize: "14px" },
  submitBtn: {
    padding: "8px 20px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  body: {
    display: "flex",
    gap: "20px",
    padding: "24px 28px",
    alignItems: "flex-start",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", gap: "16px" },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  partTag: {
    background: "#1e3a5f", color: "#60a5fa",
    padding: "3px 10px", borderRadius: "5px", fontSize: "12px", fontWeight: 700,
  },
  sectionName: { color: "#f1f5f9", fontWeight: 600, fontSize: "15px" },
  sectionTime: { color: "#64748b", fontSize: "13px", marginLeft: "auto" },
  navBtns: { display: "flex", gap: "10px" },
  navBtn: {
    padding: "10px 24px",
    background: "#1a1d27",
    color: "#cbd5e1",
    border: "1px solid #2a2d3e",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  clearBtn: { marginLeft: "auto", color: "#f87171", borderColor: "#7f1d1d" },
  nextBtn: { background: "#1e3a5f", color: "#60a5fa", borderColor: "#3b82f6" },
  error: {
    background: "#2d1515", color: "#f87171",
    border: "1px solid #7f1d1d", borderRadius: "8px",
    padding: "12px", fontSize: "14px",
  },
}