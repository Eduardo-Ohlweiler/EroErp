import { AuthProvider } from "./contexts/AuthProvider"
import { Router } from "./routes/router"

function App() {

  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
    
  )
}

export default App
