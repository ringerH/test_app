const BASE = "http://localhost:8000"

export async function startTest() {
  const res = await fetch(`${BASE}/test/start`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to start test")
  return res.json()   // { session_id, test }
}

export async function submitTest(session_id, user_answers, section_times) {
  const res = await fetch(`${BASE}/test/submit`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ session_id, user_answers, section_times }),
  })
  if (!res.ok) throw new Error("Failed to submit test")
  return res.json()   // { attempt_id, result }
}

export async function getHistory() {
  const res = await fetch(`${BASE}/results/history`)
  if (!res.ok) throw new Error("Failed to fetch history")
  return res.json()
}
