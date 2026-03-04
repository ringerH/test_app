import { useState, useRef } from "react"
import Timer from "../components/Timer"
import QuestionCard from "../components/QuestionCard"
import SectionNav from "../components/SectionNav"
import { submitTest } from "../api"

export default function Test({ sessionId, testData, onFinish }) {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [activeQIdx, setActiveQIdx]             = useState(0)
  const [answers, setAnswers]                   = useState({})
  const [submitting, setSubmitting]             = useState(false)
  const [error, setError]                       = useState(null)
  const sectionStartTimes                       = useRef({})

  const sections       = testData.sections
  const activeSection  = sections[activeSectionIdx]
  const activeQuestion = activeSection.questions[activeQIdx]
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const totalAnswered  = Object.keys(answers).length

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
      const prev = sections[activeSectionIdx - 1]
      setActiveSectionIdx(s => s - 1)
      setActiveQIdx(prev.questions.length - 1)
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
    if (!window.confirm(`Submit test? ${totalAnswered}/${totalQuestions} answered.`)) return
    const section_times = {}
    for (const [sec, startTime] of Object.entries(sectionStartTimes.current)) {
      section_times[sec] = Math.floor((Date.now() - startTime) / 1000)
    }
    setSubmitting(true); setError(null)
    try {
      const data = await submitTest(sessionId, answers, section_times)
      onFinish(data.result)
    } catch {
      setError("Submission failed. Please try again.")
      setSubmitting(false)
    }
  }

  const isFirst = activeSectionIdx === 0 && activeQIdx === 0
  const isLast  = activeSectionIdx === sections.length - 1 &&
                  activeQIdx === activeSection.questions.length - 1

  return (
    <div className="test-page">

      {/* ── Top bar ── */}
      <div className="topbar">
        <span className="top-title">TCS NQT</span>
        <Timer totalSeconds={testData.total_time_mins * 60} onExpire={handleSubmit} />
        <div className="top-right">
          <span className="top-progress">{totalAnswered}/{totalQuestions}</span>
          <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="test-body">
        <SectionNav
          sections={sections}
          activeSectionIdx={activeSectionIdx}
          activeQIdx={activeQIdx}
          answers={answers}
          onJump={handleJump}
        />

        <div className="test-main">
          {/* Section label */}
          <div className="section-label">
            <span className="part-tag">{activeSection.part}</span>
            <span className="section-name">{activeSection.section}</span>
            <span className="section-time">⏱ {activeSection.time_mins}m</span>
          </div>

          {/* Question */}
          <QuestionCard
            question={activeQuestion}
            index={activeQIdx}
            total={activeSection.questions.length}
            selected={answers[activeQuestion.q_id] || null}
            onSelect={handleSelect}
            section={activeSection.section}
          />

          {error && <div className="error-box">{error}</div>}

          {/* Navigation */}
          <div className="nav-row">
            <button className="nav-btn" onClick={handlePrev} disabled={isFirst}>← Prev</button>
            <button
              className="nav-btn clear-btn"
              onClick={() => {
                const u = { ...answers }
                delete u[activeQuestion.q_id]
                setAnswers(u)
              }}
            >Clear</button>
            <button className="nav-btn next-btn" onClick={handleNext} disabled={isLast}>Next →</button>
          </div>
        </div>
      </div>

      <style>{`
        .test-page { min-height: 100vh; background: var(--bg); }

        /* Top bar */
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          padding: 10px clamp(12px, 3vw, 28px);
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 100;
        }
        .top-title  { color: var(--text); font-weight: 700; font-size: clamp(13px, 2.5vw, 16px); white-space: nowrap; }
        .top-right  { display: flex; align-items: center; gap: 8px; }
        .top-progress { color: var(--muted); font-size: clamp(11px, 2vw, 13px); white-space: nowrap; }
        .submit-btn {
          padding: 7px clamp(10px, 2vw, 18px);
          background: #dc2626; color: #fff;
          border: none; border-radius: 7px;
          font-size: clamp(11px, 2vw, 14px); font-weight: 600;
          white-space: nowrap;
        }
        .submit-btn:hover:not(:disabled) { background: #b91c1c; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Body: sidebar + main side by side on desktop, stacked on mobile */
        .test-body {
          display: flex;
          gap: clamp(10px, 2vw, 20px);
          padding: clamp(12px, 3vw, 24px) clamp(12px, 3vw, 28px);
          align-items: flex-start;
        }
        .test-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Section label */
        .section-label { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .part-tag {
          background: #1e3a5f; color: var(--accent-lt);
          padding: 3px 10px; border-radius: 5px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .section-name { color: var(--text); font-weight: 600; font-size: clamp(13px, 2vw, 15px); }
        .section-time { color: var(--muted); font-size: 13px; margin-left: auto; }

        /* Nav row */
        .nav-row { display: flex; gap: 8px; }
        .nav-btn {
          flex: 1;
          padding: clamp(8px, 2vw, 11px) clamp(12px, 2vw, 24px);
          background: var(--surface);
          color: var(--soft);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: clamp(12px, 2vw, 14px); font-weight: 600;
        }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .clear-btn { flex: 0; color: var(--red); border-color: #7f1d1d; }
        .next-btn  { background: #1e3a5f; color: var(--accent-lt); border-color: var(--accent); }

        .error-box {
          background: #2d1515; color: var(--red);
          border: 1px solid #7f1d1d; border-radius: 8px;
          padding: 12px; font-size: 14px;
        }

        /* Mobile: stack nav on top */
        @media (max-width: 700px) {
          .test-body     { flex-direction: column; }
          .section-time  { display: none; }
        }
      `}</style>
    </div>
  )
}