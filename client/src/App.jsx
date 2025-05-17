import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Pages/Auth/Login'
import Signup from './Pages/Auth/Signup'
import { ToastContainer } from 'react-toastify'
import Dashboard from './Pages/Dashboard/Dashboard'
import Profile from './Pages/Profile/Profile'
import Curriculum from "./Pages/Curriculum/Curriculum"
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
      </Routes>
    </Router>
  )
}

export default App