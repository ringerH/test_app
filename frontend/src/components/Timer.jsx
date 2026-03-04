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
    ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`

  const isLow = secs < 300   // under 5 mins → red

  return (
    <span style={{ color: isLow ? "#f87171" : "#60a5fa", fontWeight: 700, fontSize: "18px", fontVariantNumeric: "tabular-nums" }}>
      ⏱ {display}
    </span>
  )
}