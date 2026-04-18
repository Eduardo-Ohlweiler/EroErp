import { AuthProvider } from "./contexts/AuthProvider"
import { TMessageProvider } from "./contexts/TMessageProvider"
import { Router } from "./routes/router"

function App() {

  return (
    <AuthProvider>
      <TMessageProvider>
        <Router />
      </TMessageProvider>
    </AuthProvider>
  )
}

export default App
