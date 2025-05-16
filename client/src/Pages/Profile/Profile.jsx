import React from 'react'
import Navbar from '../../Components/Navbar/Navbar'
import './Profile.css'

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {}

  return (
    <>
      <Navbar />
      <div className="profile-bg">
        <div className="profile-card animated-fadein">
          <div className="profile-avatar-glow">
            <img src={user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=neura1"} alt="avatar" />
          </div>
          <h2 className="profile-name">{user.name || "User"}</h2>
          <div className="profile-divider"></div>
          <p className="profile-email">{user.email || "user@email.com"}</p>
        </div>
      </div>
    </>
  )
}

export default Profile