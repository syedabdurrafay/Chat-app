import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../../context/ChatProvider';
import './Login.css';

const Login = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = ChatState();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!email || !password) {
      setError('Please fill all the fields');
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      };

      const { data } = await axios.post(
        'http://localhost:5000/api/user/login',
        { email, password },
        config
      );

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      navigate('/chats');
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Talk-A-Tive</h1>
      <p className="login-subtitle">Connect with your friends in real-time</p>

      {error && <div className="login-error">{error}</div>}

      <form onSubmit={submitHandler}>
        <div className="login-input-group">
          <label className="login-label">Email Address</label>
          <input
            type="email"
            className="login-input"
            placeholder="Enter Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-input-group">
          <label className="login-label">Password</label>
          <div className="password-input-wrapper">
            <input
              type={show ? 'text' : 'password'}
              className="login-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShow(!show)}
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="login-button login-button-primary"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <button
        className="login-button login-button-secondary"
        onClick={() => {
          setEmail('guest@example.com');
          setPassword('123456');
        }}
      >
        Get Guest User Credentials
      </button>
    </div>
  );
};

export default Login;