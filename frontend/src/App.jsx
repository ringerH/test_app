import { useState } from "react"
import Home from "./pages/Home"
import Test from "./pages/Test"
import Results from "./pages/Results"

export default function App() {
  const [page, setPage]           = useState("home")   // "home" | "test" | "results"
  const [sessionId, setSessionId] = useState(null)
  const [testData, setTestData]   = useState(null)
  const [resultData, setResultData] = useState(null)

  function goToTest(session_id, test) {
    setSessionId(session_id)
    setTestData(test)
    setPage("test")
  }

  function goToResults(result) {
    setResultData(result)
    setPage("results")
  }

  function goHome() {
    setPage("home")
    setSessionId(null)
    setTestData(null)
    setResultData(null)
  }

  if (page === "home")    return <Home onStart={goToTest} />
  if (page === "test")    return <Test sessionId={sessionId} testData={testData} onFinish={goToResults} />
  if (page === "results") return <Results result={resultData} onHome={goHome} />
}