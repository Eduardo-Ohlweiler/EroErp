import { AuthProvider } from "./contexts/AuthProvider"
import { TMessageProvider } from "./contexts/TMessageProvider"
import { TQuestionProvider } from "./contexts/TQuestionProvider"
import { Router } from "./routes/router"

function App() {
  return (
    <AuthProvider>
      <TMessageProvider>
        <TQuestionProvider>
          <Router />
        </TQuestionProvider>
      </TMessageProvider>
    </AuthProvider>
  )
}

export default App
