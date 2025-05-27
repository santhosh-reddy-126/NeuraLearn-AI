import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import * as jwt_decode from 'jwt-decode'
import { useEffect, useState } from 'react'

import Login from './Pages/Auth/Login'
import Dashboard from './Pages/Dashboard/Dashboard'
import Profile from './Pages/Profile/Profile'
import Curriculum from "./Pages/Curriculum/Curriculum"
import StudyCurriculum from './Pages/StudyCurriculum/StudyCurriculum'
import TakeTest from './Components/TakeTest/TakeTest'
import Quiz from './Pages/Quiz/Quiz'
import NotFound from './Components/NotFound/NotFound'
import AnalyticsPage from './Pages/Analytics/AnalyticsPage'

function AppWrapper() {
  const navigate = useNavigate()
  const [token, setToken] = useState(localStorage.getItem('token'))

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
    navigate('/')
  }

  useEffect(() => {
    if (!token){
      navigate('/')
      return
    } 
  }, [token])

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login onLogin={(t) => { setToken(t); localStorage.setItem('token', t) }} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/study-curriculum/:id" element={<StudyCurriculum />} />
        <Route path="/test/:id/:day" element={<TakeTest />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/report/:id" element={<AnalyticsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  )
}
