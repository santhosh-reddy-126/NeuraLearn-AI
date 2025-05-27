import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../Components/Navbar/Navbar';

const avatars = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Christopher",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jameson",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jessica",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=neura1"
];

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(avatars[0]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const backend = import.meta.env.VITE_BACKEND_URL;
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (isSignup && (!name || !avatar))) {
      setError('Please fill in all required fields.');
      return;
    }

    const endpoint = isSignup ? 'signup' : 'login';
    const payload = isSignup ? { name, email, password, avatar } : { email, password };

    try {
      const resp = await axios.post(`${backend}api/user/${endpoint}`, payload);
      if (resp.data.success) {
        toast.success(resp.data.message);
        if (!isSignup) {
          localStorage.setItem('token', resp.data.token);
          localStorage.setItem('user', JSON.stringify(resp.data.user));
          nav('/dashboard');
        } else {
          setIsSignup(false);
        }
      } else {
        toast.error(resp.data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error('Something went wrong');
    }
  };

  return (
    <div>
      <Navbar minimal={true} />
      <div className="login-bg">
        <div className="login-card">
          <div className="login-logo-text">
            <span role="img" aria-label="logo" className="logo-emoji">🧠</span>
            <span className="logo-name">NeuraLearn AI</span>
          </div>

          <h2 className="login-title">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="login-subtitle">
            {isSignup ? 'Sign up for NeuraLearn AI' : 'Sign in to NeuraLearn AI'}
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup && (
              <>
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
              </>
            )}

            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete={isSignup ? 'username' : 'email'}
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isSignup ? 'Create a password' : '••••••••'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {isSignup && (
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
            )}

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn">
              {isSignup ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="login-link"
              style={{ cursor: 'pointer' }}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </span>
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
  );
}

export default Login;
