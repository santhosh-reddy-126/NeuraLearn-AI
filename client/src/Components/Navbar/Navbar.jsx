import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

const Navbar = () => {
  const nav = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    nav('/login')
  }

  const handleProfile = () => {
    nav('/profile')
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={()=>nav("/dashboard")}>
        <span role="img" aria-label="logo" style={{ fontSize: 32, verticalAlign: 'middle' }}>🧠</span>
        <span className="navbar-name">NeuraLearn AI</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="navbar-profile" onClick={handleProfile} title="Profile">
          {/* Simple user SVG icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#3F8EFC" strokeWidth="2" />
            <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" stroke="#3F8EFC" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar