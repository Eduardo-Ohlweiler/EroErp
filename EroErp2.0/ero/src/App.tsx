import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { TQuestionProvider } from '@/components/common'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TQuestionProvider>
          <AppRoutes />
        </TQuestionProvider>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          theme="colored"
          newestOnTop
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
