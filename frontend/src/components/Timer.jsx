import { useState, useEffect } from "react"

export default function Timer({ totalSeconds, onExpire }) {
  const [secs, setSecs] = useState(totalSeconds)

  useEffect(() => {
    if (secs <= 0) { onExpire?.(); return }
    const t = setTimeout(() => setSecs(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secs])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const display = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`

  const isLow = secs < 300

  return (
    <span className={`timer ${isLow ? "timer--low" : ""}`}>
      ⏱ {display}
      <style>{`
        .timer {
          color: var(--accent-lt);
          font-weight: 700;
          font-size: clamp(13px, 3vw, 17px);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }
        .timer--low { color: var(--red); }
      `}</style>
    </span>
  )
}