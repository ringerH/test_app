export default function SectionNav({ sections, activeSectionIdx, activeQIdx, answers, onJump }) {
  return (
    <nav className="snav">
      {sections.map((section, si) => {
        const isActive = si === activeSectionIdx
        return (
          <div key={si} className="snav-section">
            <div className={`snav-title ${isActive ? "snav-title--on" : ""}`}>
              <span>{section.section}</span>
              <span className="snav-meta">{section.questions.length}Q · {section.time_mins}m</span>
            </div>
            <div className="snav-dots">
              {section.questions.map((q, qi) => {
                const answered  = !!answers[q.q_id]
                const isCurrent = si === activeSectionIdx && qi === activeQIdx
                return (
                  <button
                    key={qi}
                    className={`dot ${isCurrent ? "dot--current" : answered ? "dot--answered" : ""}`}
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

      <style>{`
        /* ── Desktop: vertical sidebar ── */
        .snav {
          width: 210px;
          min-width: 210px;
          flex-shrink: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow-y: auto;
          max-height: calc(100vh - 100px);
          position: sticky;
          top: 72px;
          align-self: flex-start;
        }
        .snav-section {}
        .snav-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }
        .snav-title--on { color: var(--accent-lt); }
        .snav-meta {
          color: var(--muted2);
          font-size: 10px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }
        .snav-dots { display: flex; flex-wrap: wrap; gap: 5px; }
        .dot {
          width: 26px; height: 26px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--muted);
          font-size: 11px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          padding: 0; line-height: 1;
        }
        .dot--answered { background: #1e3a5f; border-color: var(--accent); color: var(--accent-lt); }
        .dot--current  { background: var(--accent); border-color: var(--accent); color: #fff; }

        /* ── Mobile: horizontal scrolling strip ── */
        @media (max-width: 700px) {
          .snav {
            width: 100%;
            min-width: 0;
            max-height: none;
            position: static;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 10px 12px;
            gap: 16px;
            border-radius: 10px;
            -webkit-overflow-scrolling: touch;
          }
          .snav-section { flex-shrink: 0; }
          .snav-title   { flex-direction: row; align-items: center; gap: 6px; white-space: nowrap; }
        }
      `}</style>
    </nav>
  )
}