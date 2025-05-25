import React from 'react'
import Navbar from '../../Components/Navbar/Navbar'
import './Profile.css'
import { backend } from '../../../data'
import { useState, useEffect } from 'react'
import axios from 'axios'

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const [badges, setBadge] = useState([]);

  const [xp, setXp] = useState(0)

  useEffect(() => {
    const fetchXP = async () => {
      try {
        const response = await axios.post(backend + "api/user/getXP", {
          id: user.id
        });
        if (response.data.success) {
          setXp(response.data.XP);
          setBadge(response.data.badges);
        }

      } catch (error) {
        console.error("Failed to fetch XP:", error)
      }
    }

    if (user.id) {
      fetchXP()
    }
  }, [user.id])

  const level = 1 + Math.floor(xp / 100)
  const progress = xp % 100

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

          {/* XP and Level Section */}
          <div className="profile-xp-section">
            <p><strong>Level:</strong> {level}</p>
            <p><strong>Total XP:</strong> {xp}</p>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p>{100 - progress}XP More to next level</p>
          </div>

          {badges && badges.length > 0 && (
            <div className="profile-badges-section">
              <h3>Badges</h3>
              <div className="badges-container">
                {badges.map((badge, index) => (
                  <div key={index} className="badge">
                    <span className="badge-name">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Profile
