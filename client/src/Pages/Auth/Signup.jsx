import React, { useState } from 'react'
import './Login.css'
import axios from "axios"
import {backend} from '../../../data'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const avatars = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Christopher",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jameson",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jessica",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=neura1"
]

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(avatars[0])
  const [error, setError] = useState('')
  const nav = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !avatar) {
      setError('Please fill in all fields and select an avatar.')
    } else {
      setError('')
      try {
        const resp = await axios.post(backend + "api/user/signup", {
          name,
          email,
          password,
          avatar
        })
        if (resp.data.success) {
          toast.success(resp.data.message);
          nav("/login");
        } else {
          toast.error(resp.data.message);
        }

      } catch (err) {
        console.log(err)
        toast.error('Something went wrong', {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo-text">
          <span role="img" aria-label="logo" style={{ fontSize: 48, verticalAlign: 'middle' }}>🧠</span>
          <span className="logo-name">NeuraLearn AI</span>
        </div>
        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Sign up for NeuraLearn AI</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your Name"
              autoComplete="name"
            />
          </div>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>
          <div className="login-field">
            <label>Choose an Avatar</label>
            <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {avatars.map((url, idx) => (
                <img
                  key={url}
                  src={url}
                  alt={`avatar-${idx + 1}`}
                  className={`avatar-option${avatar === url ? ' selected' : ''}`}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: avatar === url ? '2.5px solid #3F8EFC' : '2px solid #E2E8F0',
                    cursor: 'pointer',
                    boxShadow: avatar === url ? '0 0 0 2px #3EE4B2' : 'none',
                    transition: 'border 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => setAvatar(url)}
                />
              ))}
            </div>
          </div>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          <button type="submit" className="login-btn">
            Sign Up
          </button>
        </form>
        <div className="login-footer">
          Already have an account?{' '}
          <a href="/login" className="login-link">
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}

export default Signup