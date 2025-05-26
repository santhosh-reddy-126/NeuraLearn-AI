import React, { useState } from 'react'
import './Login.css'
import axios from "axios"
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Navbar from '../../Components/Navbar/Navbar'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const backend = import.meta.env.VITE_BACKEND_URL;

  const [error, setError] = useState('')
  const nav = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
    } else {
      setError('')
      try {
        const resp = await axios.post(backend + "api/user/login", {
          email,
          password
        })
        if (resp.data.success) {
          toast.success(resp.data.message);
          localStorage.setItem('token', resp.data.token); 
          localStorage.setItem('user', JSON.stringify(resp.data.user));
          nav("/dashboard");
        } else {
          toast.error(resp.data.message);
        }
      } catch (err) {
        console.log(err)
        toast.error('Something went wrong');
      }
    }
  }

  return (
    <div>
      <Navbar minimal={true} />
      <div className="login-bg">
        <div className="login-card">
          <div className="login-logo-text">
            <span role="img" aria-label="logo" className="logo-emoji">🧠</span>
            <span className="logo-name">NeuraLearn AI</span>
          </div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to NeuraLearn AI</p>
          <form className="login-form" onSubmit={handleSubmit}>
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
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}
            <button type="submit" className="login-btn">
              Sign In
            </button>
          </form>
          <div className="login-footer">
            Don&apos;t have an account?{' '}
            <a href="/register" className="login-link">
              Sign up
            </a>
          </div>
        </div>

        {/* Footer outside the login-card container */}
        <div className="contact-footer">
          <p>Email: <a href="mailto:santhoshbeeram19@gmail.com">santhoshbeeram19@gmail.com</a></p>
          <p>Instagram: <a href="https://www.instagram.com/santhosh_reddy_19_?igsh=YXlxZGpvNmo4MGU=" target="_blank" rel="noopener noreferrer">@santhosh_reddy_19_</a></p>
          <p>Contact for bug reporting</p>
        </div>
      </div>
    </div>
  )
}

export default Login
