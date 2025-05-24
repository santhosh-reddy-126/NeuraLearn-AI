import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Pages/Auth/Login'
import Signup from './Pages/Auth/Signup'
import { ToastContainer } from 'react-toastify'
import Dashboard from './Pages/Dashboard/Dashboard'
import Profile from './Pages/Profile/Profile'
import Curriculum from "./Pages/Curriculum/Curriculum"
import StudyCurriculum from './Pages/StudyCurriculum/StudyCurriculum'
import TakeTest from './Components/TakeTest/TakeTest'
import Quiz from './Pages/Quiz/Quiz'
import AnalyticsPage from './Pages/Analytics/AnalyticsPage'
function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/study-curriculum/:id" element={<StudyCurriculum />} />
        <Route path="/test/:id/:day" element={<TakeTest />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/report/:id" element={<AnalyticsPage />} />


      </Routes>
    </Router>
  )
}

export default App